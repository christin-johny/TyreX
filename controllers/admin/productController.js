const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Size = require("../../models/size");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const size = require("../../models/size");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");

const loadAddProductPage = (req, res, next) => {
  Promise.all([Category.find({}), Brand.find({}), Size.find({})])
    .then(([category, brand, size]) => {
      res.render("addProduct", {
        cat: category,
        brand: brand,
        size: size,
      });
    })
    .catch((error) => {
      next(error);
    });
};

const addproduct = async (req, res, next) => {
  try {
    const {
      productName,
      description,
      productNumber,
      category,
      brand,
      size,
      regularPrice,
      warranty,
      quantity,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.IMAGE_UPLOAD_REQUIRED,
      });
    }

    for (let file of req.files) {
      if (!file.mimetype.startsWith("image/")) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: Messages.ONLY_IMAGE_FILES_ALLOWED,
        });
      }
    }

    const existingProduct = await Product.findOne({ productName: productName });
    if (existingProduct) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.PRODUCT_EXISTS,
      });
    }
    const imagePaths = req.files.map((file) => file.filename);

    const sizeId = await Size.findOne({ name: size }, { _id: 1 });
    const brandId = await Brand.findOne({ brandName: brand }, { _id: 1 });
    const categoryData = await Category.findOne(
      { name: category },
      { _id: 1, categoryOffer: 1 }
    );
    let discountAmount;
    if (categoryData.categoryOffer > 0) {
      discountAmount =
        regularPrice - (regularPrice * categoryData.categoryOffer) / 100;
    } else {
      discountAmount = regularPrice;
    }
    const newProduct = new Product({
      productName: productName,
      description,
      productNumber,
      categoryId: categoryData._id,
      brandId,
      sizeId,
      regularPrice,
      salePrice: discountAmount,
      warranty,
      quantity,
      categoryOffer: categoryData.categoryOffer,
      productImage: imagePaths,
    });

    await newProduct.save();

    res.status(StatusCodes.SUCCESS).json({
      success: true,
      message: Messages.PRODUCT_ADDED_SUCCESSFULLY,
    });
  } catch (error) {
    next(error);
  }
};

const loadAllproducts = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 7;

    const productData = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        {
          brandId: await Brand.findOne({
            brandName: { $regex: new RegExp(".*" + search + ".*", "i") },
          })?._id,
        },
      ],
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("brandId")
      .populate("categoryId")
      .populate("sizeId")
      .sort({ createdAt: -1 })
      .exec();

    const count = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        {
          brandId: await Brand.findOne({
            brandName: { $regex: new RegExp(".*" + search + ".*", "i") },
          })?._id,
        },
      ],
    }).countDocuments();

    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });
    if (category && brand) {
      res.render("products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
        searchQuery: search,
      });
    } else {
      res.render("pageerror");
    }
  } catch (error) {
    next(error);
  }
};

const addProductOffer = async (req, res, next) => {
  try {
    const { productId, percentage } = req.body;
    const findProduct = await Product.findById(productId);
    if (!findProduct)
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: Messages.PRODUCT_NOT_FOUND,
      });

    const findCategory = await Category.findById(findProduct.categoryId);
    if (!findCategory)
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: false,
        message: Messages.CATEGORY_NOT_FOUND,
      });
      
    if (findCategory.categoryOffer >= percentage) {
      return res.json({
        status: false,
        message: Messages.PRODUCT_HAS_CATEGORY_OFFER(
          findCategory.categoryOffer
        ),
      });
    }

    findProduct.salePrice = Math.round(
      findProduct.regularPrice * (1 - percentage / 100)
    );
    findProduct.productOffer = parseInt(percentage);
    await findProduct.save();

    res.json({ status: true });
  } catch (error) {
    next(error);
  }
};

const removeProductOffer = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ status: false, message: Messages.PRODUCT_NOT_FOUND });

    product.productOffer = 0;

    const category = await Category.findById(product.categoryId);

    if (category && category.categoryOffer > 0) {
      product.salePrice = Math.round(
        product.regularPrice * (1 - category.categoryOffer / 100)
      );
    } else {
      product.salePrice = product.regularPrice;
    }

    await product.save();
    res.json({ status: true });
  } catch (error) {
    next(error);
  }
};

const blockProduct = async (req, res, next) => {
  try {
    const id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const unblockProduct = async (req, res, next) => {
  try {
    const id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const loadEditProduct = (req, res, next) => {
  const id = req.query.id;
  Promise.all([
    Product.findOne({ _id: id })
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "brandId", select: "brandName" })
      .populate({ path: "sizeId", select: "name" })
      .lean(),
    Category.find({}),
    Brand.find({}),
    Size.find({}),
  ])
    .then(([product, category, brand, size]) => {
      res.render("editProduct", {
        product: product,
        cat: category,
        brand: brand,
        size: size,
      });
    })
    .catch((error) => {
      next(error);
    });
};

const editProduct = async (req, res, next) => {
  try {

    const id = req.params.id;

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ status: false, message: Messages.PRODUCT_NOT_FOUND });
    }

    const data = req.body;

    const existingProduct = await Product.findOne({
      productName: { $regex: `^${data.productName}$`, $options: 'i' },
      _id: { $ne: id },
    });
    
    if (existingProduct) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.PRODUCT_EXISTS,
      });
    }
    for (let file of req.files) {
      if (!file.mimetype.startsWith("image/")) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: Messages.ONLY_IMAGE_FILES_ALLOWED,
        });
      }
    }

    const updatedImages = req.files?.map((file) => file.filename) || [];
    const existingImages = product.productImage;
    const images = [...existingImages, ...updatedImages];

    const brandId = await Brand.findOne({ brandName: data.brand }, { _id: 1 });
    const sizeId = await Size.findOne({ name: data.size }, { _id: 1 });

    const categoryData = await Category.findOne(
      { name: data.category },
      { _id: 1, categoryOffer: 1 }
    );

    let discountAmount;
    if (
      categoryData.categoryOffer > 0 &&
      categoryData.categoryOffer > product.productOffer
    ) {
      discountAmount =
        data.regularPrice -
        (data.regularPrice * categoryData.categoryOffer) / 100;
    } else if (product.productOffer > 0) {
      discountAmount =
        data.regularPrice - (data.regularPrice * product.productOffer) / 100;
    } else {
      discountAmount = data.regularPrice;
    }

    const updateFields = {
      productName: data.productName,
      description: data.description,
      productNumber: data.productNumber,
      categoryId: categoryData._id,
      brandId: brandId,
      sizeId: sizeId,
      regularPrice: data.regularPrice,
      salePrice: discountAmount,
      quantity: data.quantity,
      warranty: data.warranty,
      categoryOffer: categoryData.categoryOffer,
      productOffer: product.productOffer,
    };

    if (images.length > 0) {
      updateFields.productImage = images;
    }

    await Product.findByIdAndUpdate(id, updateFields, { new: true });
    return res.status(StatusCodes.SUCCESS).json({
      success: true,
      message: Messages.PRODUCT_EDITED_SUCCESSFULLY,
    });
    
  } catch (error) {
    next(error);
  }
};

const deleteSingleImage = async (req, res, next) => {
  try {
    const { imageNameToServer, productIdToServer } = req.body;
    const product = await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { productImage: imageNameToServer },
    });

    res.send({ status: true });
  } catch (error) {
    next(error);
  }
};

const loadInventory = async (req, res,next) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 7;

    const brand = await Brand.findOne({
      brandName: { $regex: search, $options: "i" },
    });
    const category = await Category.findOne({
      name: { $regex: search, $options: "i" },
    });

    const productData = await Product.find({
      $or: [
        { productName: { $regex: search, $options: "i" } },
        { brandId: brand ? brand._id : null },
        { categoryId: category ? category._id : null },
      ],
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("brandId")
      .populate("categoryId")
      .sort({createdAt:-1})
      .exec();

    const count = await Product.find({
      $or: [
        { productName: { $regex: search, $options: "i" } },
        { brandId: brand ? brand._id : null },
        { categoryId: category ? category._id : null },
      ],
    }).countDocuments();

    const totalPages = Math.ceil(count / limit);

    res.render("inventory", {
      product: productData,
      currentPage: page,
      totalPages: totalPages,
      searched: search,
    });
  } catch (error) {
    next(error);
  }
};

const updateInventory = async (req, res,next) => {
  try {
    const productId = req.query.id;
    const stock = req.body.quantity;

    const newQuantity = await Product.findByIdAndUpdate(
      productId,
      { $set: { quantity: stock } },
      { new: true }
    );
    if (newQuantity) {
      return res.status(StatusCodes.SUCCESS).json({
        success: true,
        message: Messages.STOCK_UPDATED,
      });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.STOCK_UPDATE_FAILED,
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadAddProductPage,
  addproduct,
  loadAllproducts,
  addProductOffer,
  removeProductOffer,
  blockProduct,
  unblockProduct,
  loadEditProduct,
  editProduct,
  deleteSingleImage,
  loadInventory,
  updateInventory,
};
