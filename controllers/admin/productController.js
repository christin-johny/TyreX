const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const Size = require("../../models/size");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");



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
      res.redirect('/admin/pageerror')
    });
};





module.exports = { loadAddProductPage };
