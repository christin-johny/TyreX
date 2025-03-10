const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");

const loadBrandPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const brandData = await Brand.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalBrands = await Brand.countDocuments();
    const totalPages = Math.ceil(totalBrands / limit);
    const reverseBrand = brandData.reverse();
    res.render("brands", {
      data: reverseBrand,
      currentPage: page,
      totalPages: totalPages,
      totalBrands: totalBrands,
    });
  } catch (error) {
    res.redirect("/pageerror");
    console.log(error);
  }
};




const addBrand = async (req, res) => {
  try {
    const brandName = req.body.name;
    const image = req.file.filename;

    const existingBrand = await Brand.findOne({ brandName: brandName });
    if (existingBrand) {
      return res
        .status(400)
        .json({ success: false, message: "Brand already exists." });
    }

    const newBrand = new Brand({
      brandName: brandName,
      brandImage: image,
    });

    await newBrand.save();

    res
      .status(200)
      .json({ success: true, message: "Brand added successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while adding the brand.",
      });
  }
};

module.exports = { loadBrandPage, addBrand };
