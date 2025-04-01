const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");

const categoryInfo = async (req, res) => {
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
    console.error("Error fetching categories:", error);
    res.redirect("/pageerror");
  }
};
const addCategory = async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required" });
  }

  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const newCategory = new Category({
      name,
      description,
    });

    await newCategory.save();

    return res.json({ message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const { percentage, categoryId } = req.body;

    if (!percentage || !categoryId) {
      return res.status(400).json({
        status: false,
        message: "Percentage and category ID are required.",
      });
    }

    if (percentage < 1 || percentage > 100) {
      return res.status(400).json({
        status: false,
        message: "Percentage must be between 1 and 100.",
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found." });
    }

    const products = await Product.find({ categoryId: category._id });

    const hasProductsOffer = products.some(
      (product) => product.productOffer > percentage
    );
    if (hasProductsOffer) {
      return res.status(400).json({
        status: false,
        message:
          "Products within this category already have a product-specific offer greater than the category offer.",
      });
    }

    await Category.updateOne(
      { _id: categoryId },
      { $set: { categoryOffer: percentage } }
    );

    for (const product of products) {
      const discountAmount = (product.regularPrice * percentage) / 100;
      product.salePrice = product.regularPrice - discountAmount;
    if(product.productOffer<percentage){
      product.productOffer = percentage;
    }
      await product.save();
    }

    return res.status(200).json({
      status: true,
      message: `Offer of ${percentage}% added successfully.`,
    });
  } catch (error) {
    console.error("Error adding category offer:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while adding the offer.",
    });
  }
};
const removeCategoryOffer = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res
        .status(400)
        .json({ status: false, message: "Category ID is required." });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found." });
    }

    await Category.updateOne(
      { _id: categoryId },
      { $set: { categoryOffer: 0 } }
    );

    const products = await Product.find({ categoryId: category._id });

    for (const product of products) {
      product.salePrice = product.regularPrice;

      await product.save();
    }

    return res
      .status(200)
      .json({ status: true, message: "Offer removed successfully." });
  } catch (error) {
    console.error("Error removing category offer:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while removing the offer.",
    });
  }
};

const getListCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect("/admin/category");
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const getUnlistCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect("/admin/category");
  } catch (error) {
    res.redirect("/pageerror");
  }
};

const loadEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });

    if (!category) {
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });
    }

    return res.status(200).json({ status: true, category });
  } catch (error) {
    console.error("Error loading category:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { categoryName, description } = req.body;

    const existingCategory = await Category.findOne({
      name: categoryName,
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(400).json({
        status: false,
        message: "Category exists. Please choose another name.",
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
      return res
        .status(404)
        .json({ status: false, message: "Category not found" });
    }

    return res
      .status(200)
      .json({ status: true, message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
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
