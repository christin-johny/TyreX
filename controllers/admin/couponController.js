const Coupon = require("../../models/couponSchema");

const loadCoupon = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    const limit = 8;
    let coupons = await Coupon.find();

    for (let coupon of coupons) {
      if (coupon.expireOn < new Date() || coupon.createdOn > new Date()) {
        await Coupon.findByIdAndUpdate(
          coupon._id,
          { $set: { isListed: false } },
          { new: true }
        );
      } else {
        await Coupon.findByIdAndUpdate(
          coupon._id,
          { $set: { isListed: true } },
          { new: true }
        );
      }
    }

    const updatedCoupons = await Coupon.find()
      .limit(limit)
      .skip((page - 1) * limit)

    const count= await Coupon.countDocuments()
    const totalPages = Math.ceil(count / limit);

    return res.render("coupon", { 
      coupons: updatedCoupons,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error(error);
  }
};

const addCoupon = async (req, res) => {
  try {
    const data = {
      name: req.body.couponName,
      startDate: new Date(req.body.startDate + "T00:00:00"),
      endDate: new Date(req.body.endDate + "T00:00:00"),
      offerPrice: parseInt(req.body.offerPrice),
      minimumPrice: parseInt(req.body.minimumPrice),
    };

    const existingCoupon = await Coupon.find({ name: data.name });

    if (existingCoupon.length > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "coupon with this name already exists",
        });
    }

    const newCoupon = new Coupon({
      name: data.name,
      createdOn: data.startDate,
      expireOn: data.endDate,
      offerPrice: data.offerPrice,
      minimumPrice: data.minimumPrice,
    });

    const saved = await newCoupon.save();

    if (saved) {
      return res
        .status(200)
        .json({ success: true, message: "coupon added sucessfully" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Failed to add coupon." });
    }
  } catch (error) {
    console.error(error);
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;
    const data = {
      name: req.body.name,
      startDate: new Date(req.body.createdOn + "T00:00:00"),
      endDate: new Date(req.body.expireOn + "T00:00:00"),
      offerPrice: parseInt(req.body.offerPrice),
      minimumPrice: parseInt(req.body.minimumPrice),
    };

    const existingCoupon = await Coupon.find({
      name: data.name,
      _id: { $ne: couponId },
    });

    if (existingCoupon.length > 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "coupon with this name already exists",
        });
    }
    const newCoupon = {
      name: data.name,
      createdOn: data.startDate,
      expireOn: data.endDate,
      offerPrice: data.offerPrice,
      minimumPrice: data.minimumPrice,
    };

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, newCoupon, {
      new: true,
    });
    if (updatedCoupon) {
      return res
        .status(200)
        .json({ success: true, message: "updated Successfully" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Failed to update Coupon" });
    }
  } catch (error) {}
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (deletedCoupon) {
      return res.status(200).json({ success: true, message: "coupon deleted" });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Failed to delete Coupon." });
    }
  } catch (error) {
    console.error(error);
  }
};
module.exports = { loadCoupon, addCoupon, editCoupon, deleteCoupon };
