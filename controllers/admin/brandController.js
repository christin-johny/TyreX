const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");

const loadBrandPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
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




const blockBrand = async (req, res) => {
    try {
      const id = req.query.id;
      await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });
      req.session.message = { type: 'success', text: 'Brand blocked successfully!' };
      res.redirect('/admin/brands');
    } catch (error) {
      console.error(error);
      req.session.message = { type: 'error', text: 'An error occurred while blocking the brand.' };
      res.redirect('/pageerror');
    }
  };
  
  const unblockBrand = async (req, res) => {
    try {
      const id = req.query.id;
      await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
      req.session.message = { type: 'success', text: 'Brand unblocked successfully!' };
      res.redirect('/admin/brands');
    } catch (error) {
      console.error(error);
      req.session.message = { type: 'error', text: 'An error occurred while unblocking the brand.' };
      res.redirect('/pageerror');
    }
  };
  
  const deleteBrand = async (req, res) => {
    try {
      const id = req.query.id;
      if (!id) {
        req.session.message = { type: 'error', text: 'Invalid brand ID.' };
        return res.status(400).redirect('/pageerror');
      }
      await Brand.deleteOne({ _id: id });
      req.session.message = { type: 'success', text: 'Brand deleted successfully!' };
      res.redirect('/admin/brands');
    } catch (error) {
      console.error(error);
      req.session.message = { type: 'error', text: 'An error occurred while deleting the brand.' };
      res.status(500).redirect('/pageerror');
    }
  };

  const loadEditBrand = async (req, res) => {
    try {
      const id = req.query.id;
      const brand = await Brand.findOne({ _id: id });
  
      if (!brand) {
        return res.status(404).json({ status: false, message: "Brand not found" });
      }
  
      return res.status(200).json({ status: true, brand });
    } catch (error) {
      console.error("Error loading brand:", error);
      return res.status(500).json({ status: false, message: "Internal server error" });
    }
  };
  
  const editBrand = async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const brand = await Brand.findById(id);
  
      if (!brand) {
        return res.status(404).json({ status: false, message: "Brand not found" });
      }
     const existingBrand= await Brand.findOne({brandName:name,_id:{$ne:id}});
     if(existingBrand){
      return res.status(400).json({ status: false, message: "Brand name already exists" });
     }
     console.log(existingBrand)
      const updatedImage = req.file ? [req.file.filename] : brand.brandImage;
  
      const updateData = {
        brandName: name,
        brandImage: updatedImage,
      };
  
      const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, { new: true });
  
      return res.json({ status: true, message: "Brand updated successfully!", brand: updatedBrand });
    } catch (error) {
      console.error("Error updating brand:", error);
      return res.status(500).json({ status: false, message: "Internal server error" });
    }
  };
  
module.exports = { loadBrandPage, addBrand,blockBrand,unblockBrand,deleteBrand,loadEditBrand,editBrand};
