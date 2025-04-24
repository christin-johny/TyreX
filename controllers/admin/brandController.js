const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");

const loadBrandPage = async (req, res,next) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const brandData = await Brand.find({
      brandName: { $regex: ".*" + search + ".*", $options: "i" }
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalBrands = await Brand.countDocuments({
      brandName: { $regex: ".*" + search + ".*", $options: "i" }
  });
    const totalPages = Math.ceil(totalBrands / limit);
    const reverseBrand = brandData
    res.render("brands", {
      data: reverseBrand,
      currentPage: page,
      totalPages: totalPages,
      totalBrands: totalBrands,
      searchQuery: search,
    });
  } catch (error) {
    next(error)
  }
};

const addBrand = async (req, res,next) => {
  try {
    const brandName = req.body.name;
    const image = req.file.filename;

    const existingBrand = await Brand.findOne({ brandName: new RegExp(`^${brandName}$`, 'i') });

    if (existingBrand) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.BRAND_ALREADY_EXISTS });
    }

    const newBrand = new Brand({
      brandName: brandName,
      brandImage: image,
    });

    await newBrand.save();
    res.status(StatusCodes.SUCCESS).json({ success: true, message: Messages.BRAND_ADDED });

  } catch (error) {
    next(error)    
  }
};


const blockBrand = async (req, res,next) => {
    try {
      const id = req.query.id;
      await Brand.updateOne({ _id: id }, { $set: { isBlocked: true } });
      req.session.message = { type: 'success', text: 'Brand blocked successfully!' };
      res.redirect('/admin/brands');
    } catch (error) {
      next(error)
    }
  };
  
  const unblockBrand = async (req, res,next) => {
    try {
      const id = req.query.id;
      await Brand.updateOne({ _id: id }, { $set: { isBlocked: false } });
      req.session.message = { type: 'success', text: 'Brand unblocked successfully!' };
      res.redirect('/admin/brands');
    } catch (error) {
      next(error)
    }
  };
  
  const deleteBrand = async (req, res,next) => {
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
      next(error)
    }
  };

  const loadEditBrand = async (req, res,next) => {
    try {
      const id = req.query.id;
      const brand = await Brand.findOne({ _id: id });
  
      if (!brand) {
        return res.status(404).json({ status: false, message: "Brand not found" });
      }
  
      return res.status(200).json({ status: true, brand });
    } catch (error) {
      next(error)
    }
  };
  
  const editBrand = async (req, res,next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const brand = await Brand.findById(id);
  
      if (!brand) {
        return res.status(StatusCodes.NOT_FOUND).json({ status: false, message: Messages.BRAND_NOT_FOUND });
      }
      const existingBrand = await Brand.findOne({
        brandName: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: id }
      });
            
     if(existingBrand){
      return res.status(StatusCodes.BAD_REQUEST).json({ status: false, message: Messages.BRAND_NAME_EXISTS });
     }
     
      const updatedImage = req.file ? [req.file.filename] : brand.brandImage;
  
      const updateData = {
        brandName: name,
        brandImage: updatedImage,
      };
  
      const updatedBrand = await Brand.findByIdAndUpdate(id, updateData, { new: true });
  
      return res.status(StatusCodes.SUCCESS).json({ status: true, message: Messages.BRAND_UPDATED, brand: updatedBrand });

    } catch (error) {
      next(error)
    }
  };
  
module.exports = { loadBrandPage, addBrand,blockBrand,unblockBrand,deleteBrand,loadEditBrand,editBrand};
