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
    const products = req.body;
    const productExists = await Product.findOne({
      productName: products.productName,
    });

    if (!productExists) {
      const images = [];

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          const resizedImagePath = path.join(
            "public",
            "uploads",
            "product-images",
            req.files[i].filename
          );
          await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);
          images.push(req.files[i].filename);
        }
      }

      const categoryId = await Category.findOne({ name: products.category });
      if (!categoryId) {
        console.log("invalid category");
        return res.status(400).join("invalid category");
      }

      const brandId = await Brand.findOne({ brandName: products.brand });
      if (!brandId) {
        console.log("invalid brand");
        return res.status(400).join("invalid brand");
      }

      const sizeId = await Size.findOne({ name: products.size });
      if (!sizeId) {
        console.log("invalid size");
        return res.status(400).join("invalid size");
      }

      const newProduct = new Product({
        productName: products.productName,
        description: products.description,
        categoryId: categoryId._id,
        brandId: brandId._id,
        sizeId: sizeId._id,
        productNumber: products.productNumber,
        regularPrice: products.regularPrice,
        salePrice: products.salePrice,
        quantity: products.quantity,
        warranty: products.warranty,
        productImage: images,
        status: "Available",
      });
      await newProduct.save();
      return res
        .status(200)
        .json({ success: true, message: "Product added successfully" });
    } else {
      return res.status(400).json({
        success: false,
        message: "Product already exists, please try with another name",
      });
    }
  } catch (error) {
    console.error("Error saving product", error);
    return res.redirect("/admin/pageerror");
  }
};

const loadAllproducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 3;

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
      $or:[
        {productName:{$regex:new RegExp(".*"+search+".*","i")}},
        {
          brandId: await Brand.findOne({
            brandName: { $regex: new RegExp(".*" + search + ".*", "i") }
          })?._id,
        },
      ],
    }).countDocuments();

    const category = await Category.find({isListed:true})
    const brand = await Brand.find({isBlocked:false});
    if(category&&brand){
      res.render("products",{
        data:productData,
        currentPage:page,
        totalPages:Math.ceil(count/limit),
        cat:category,
        brand:brand,
      })

    }else{
      res.render('pageerror')
    }


  } catch (error) {

    console.error(error)
    res.redirect("/admin/pageerror")
  }
};

module.exports = { loadAddProductPage, addproduct, loadAllproducts };
