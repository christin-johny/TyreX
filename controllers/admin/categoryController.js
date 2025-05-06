const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");


const categoryInfo = async (req, res,next) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    const skip = (page - 1) * limit;

    const categoryData = await Category.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    });

    const totalPages = Math.ceil(totalCategories / limit);

    res.render("category", {
      cat: categoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
      searchQuery: search,
    });
  } catch (error) {
    next(error)
  }
};

const addCategory = async (req, res,next) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: Messages.NAME_DESCRIPTION_REQUIRED });
  }

  try {
    const existingCategory = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existingCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: Messages.CATEGORY_EXISTS });

    }

    const newCategory = new Category({
      name,
      description,
    });

    await newCategory.save();

    return res.status(StatusCodes.SUCCESS).json({
      message: Messages.CATEGORY_ADDED,
    });

  } catch (error) {
    next(error)
  }
};

const addCategoryOffer = async (req, res,next) => {
  try {
    const { percentage, categoryId } = req.body;

    if (!percentage || !categoryId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: Messages.REQUIRED_FIELDS,
      });
      
    }

    if (percentage < 1 || percentage > 100) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: Messages.PERCENTAGE_RANGE,
      });
      
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: false,
        message: Messages.CATEGORY_NOT_FOUND,
      });      
    }
    const products = await Product.find({ categoryId: category._id });

    const hasProductsOffer = products.some(
      (product) => product.productOffer > percentage
    );
    if (hasProductsOffer) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: Messages.PRODUCT_OFFER_CONFLICT,
      });      
    }

    await Category.updateOne(
      { _id: categoryId },
      { $set: { categoryOffer: percentage } }
    );

    for (const product of products) {
      const discountAmount =Math.round((product.regularPrice * percentage) / 100);
      product.salePrice = Math.round(product.regularPrice - discountAmount);
    if(product.productOffer<percentage){
      product.categoryOffer = percentage;
    }
      await product.save();
    } 
    
    return res.status(StatusCodes.SUCCESS).json({
      status: true,
      message: Messages.OFFER_ADDED_SUCCESSFULLY(percentage),
    });
    
  } catch (error) {
    next(error)
  }
};

const removeCategoryOffer = async (req, res,next) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: Messages.CATEGORY_ID_REQUIRED,
      });      
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: false,
        message: Messages.CATEGORY_NOT_FOUND,
      });
      
    }

    await Category.updateOne(
      { _id: categoryId },
      { $set: { categoryOffer: 0 } }
    );

    const products = await Product.find({ categoryId: category._id });

    for (const product of products) {
      if(product.productOffer>0){
        const discountAmount =   Math.round( (product.regularPrice * product.productOffer) / 100);
      product.salePrice = Math.round(product.regularPrice - discountAmount);
      product.categoryOffer=0;
      }else{
        product.salePrice = Math.round(product.regularPrice);
        product.categoryOffer=0;
      }
      
      await product.save();
    }

    return res.status(StatusCodes.SUCCESS).json({
      status: true,
      message: Messages.OFFER_REMOVED_SUCCESSFULLY,
    });
    
  } catch (error) {
    next(error)
  }
};

const getListCategory = async (req, res,next) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect("/admin/category");
  } catch (error) {
    next(error)
  }
};

const getUnlistCategory = async (req, res,next) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect("/admin/category");
  } catch (error) {
    next(error)
  }
};

const loadEditCategory = async (req, res,next) => {
  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });

    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: false,
        message: Messages.CATEGORY_NOT_FOUND,
      });
      
    }

    return res.status(StatusCodes.SUCCESS).json({
      status: true,
      category: category,
    });
    
  } catch (error) {
    next(error)
  }
};

const editCategory = async (req, res,next) => {
  try {
    const id = req.params.id;
    const { categoryName, description } = req.body;

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, 'i') },  
      _id: { $ne: id },
    });
    

    if (existingCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: Messages.CATEGORY_EXISTS,
      });
      
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: categoryName,
        description: description,
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: false,
        message: Messages.CATEGORY_NOT_FOUND,
      });
      
    }
    return res.status(StatusCodes.SUCCESS).json({
      status: true,
      message: Messages.CATEGORY_UPDATED_SUCCESSFULLY,
    });
    
  } catch (error) {
    next(error)
  }
};
module.exports = {
  categoryInfo,
  addCategory,
  addCategoryOffer,
  removeCategoryOffer,
  getListCategory,
  getUnlistCategory,
  loadEditCategory,
  editCategory,
};
