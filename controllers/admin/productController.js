const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Size = require("../../models/size");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const size = require("../../models/size");

const loadAddProductPage = (req, res) => {
  Promise.all([Category.find({}), Brand.find({}), Size.find({})])
    .then(([category, brand, size]) => {
      res.render("addProduct", {
        cat: category,
        brand: brand,
        size: size,
      });
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      res.redirect("/admin/pageerror");
    });
};

const addproduct = async (req, res) => {
  try {
    const {
      productName,
      description,
      productNumber,
      category,
      brand,
      size,
      regularPrice,
      salePrice,
      warranty,
      quantity,
    } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.json({
        success: false,
        message: "Please upload at least one image.",
      });
    }

    const existingProduct = await Product.findOne({ productName: productName });
    if (existingProduct) {
      return res.json({ success: false, message: "Product already exists" });
    }
    const imagePaths = req.files.map((file) => file.filename);
    console.log(imagePaths);

    const sizeId = await Size.findOne({ name: size }, { _id: 1 });
    const brandId = await Brand.findOne({ brandName: brand }, { _id: 1 });
    const categoryId = await Category.findOne({ name: category }, { _id: 1 });
    const newProduct = new Product({
      productName: productName,
      description,
      productNumber,
      categoryId,
      brandId,
      sizeId,
      regularPrice,
      salePrice,
      warranty,
      quantity,
      productImage: imagePaths,
    });

    await newProduct.save();
    res.json({ success: true, message: "Product added successfully!" });
  } catch (error) {
    console.error("Error adding product:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error. Please try again later.",
      });
  }
};

const loadAllproducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 4;

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
      });
    } else {
      res.render("pageerror");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/admin/pageerror");
  }
};

const addProductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body;
    const findProduct = await Product.findById(productId);
    if (!findProduct)
      return res.json({ status: false, message: "Product not found" });

    const findCategory = await Category.findById(findProduct.categoryId);
    if (!findCategory)
      return res.json({ status: false, message: "Category not found" });

    if (findCategory.categoryOffer > percentage) {
      return res.json({
        status: false,
        message: "This product already has a higher category offer",
      });
    }

    findProduct.salePrice = Math.floor(
      findProduct.regularPrice * (1 - percentage / 100)
    );
    findProduct.productOffer = parseInt(percentage);
    await findProduct.save();

    res.json({ status: true });
  } catch (error) {
    console.error("Error adding product offer:", error);
    res.redirect("/admin/pageerror");
  }
};

const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);

    if (!product)
      return res.json({ status: false, message: "Product not found" });

    product.productOffer = 0;

    const category = await Category.findById(product.categoryId);
    if (category && category.categoryOffer > 0) {
      product.salePrice = Math.floor(
        product.regularPrice * (1 - category.categoryOffer / 100)
      );
    } else {
      product.salePrice = product.regularPrice;
    }

    await product.save();
    res.json({ status: true });
  } catch (error) {
    console.error("Error removing product offer:", error);
    res.redirect("/admin/pageerror");
  }
};

const blockProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/pageerror");
  }
};

const unblockProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/pageerror");
  }
};

const loadEditProduct = (req, res) => {
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
      console.error("Error fetching data:", error);
      res.redirect("/admin/pageerror");
    });
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    const data = req.body;

    const existingProduct = await Product.findOne({
      productName: data.productName,
      _id: { $ne: id },
    });

    if (existingProduct) {
      return res.status(400).json({
        error:
          "Product with this name already exists. Please try another name.",
      });
    }

    const updatedImages = req.files?.map((file) => file.filename) || [];
    const existingImages = product.productImage;
    const images = [...existingImages, ...updatedImages];

    const catId = await Category.findOne({ name: data.category }, { _id: 1 });
    const brandId = await Brand.findOne({ brandName: data.brand }, { _id: 1 });
    const sizeId = await Size.findOne({ name: data.size }, { _id: 1 });

    const updateFields = {
      productName: data.productName,
      description: data.description,
      productNumber: data.productNumber,
      categoryId: catId,
      brandId: brandId,
      sizeId: sizeId,
      regularPrice: data.regularPrice,
      salePrice: data.salePrice,
      quantity: data.quantity,
      warranty: data.warranty,
    };

    if (images.length > 0) {
      updateFields.productImage = images;
    }

    await Product.findByIdAndUpdate(id, updateFields, { new: true });
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer } = req.body;
    const product = await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { productImage: imageNameToServer },
    });
    const imagePath = path.join(
      "public",
      "uploads",
      "reImage",
      imageNameToServer
    );
    if (fs.existsSync(imagePath)) {
      await fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameToServer} deleted`);
    } else {
      console.log(`image ${imageNameToServer} not found`);
    }
    res.send({ status: true });
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror");
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
};
