const Coupon = require("../../models/couponSchema");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");

const loadCoupon = async (req, res,next) => {
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
      .sort({createdAt : -1})

    const count= await Coupon.countDocuments()
    const totalPages = Math.ceil(count / limit);

    return res.render("coupon", { 
      coupons: updatedCoupons,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    next(error)
  }
};

const addCoupon = async (req, res, next) => {
  try {
    const {
      couponName,
      startDate,
      endDate,
      offerPrice,
      discountPercentage,
      maxDiscountAmount,
      minimumPrice
    } = req.body;

    // Validation for offerPrice or discountPercentage
    if (!offerPrice && !discountPercentage) {
      return res.status(400).json({
        success: false,
        message: "Either offerPrice or discountPercentage is required.",
      });
    }

    // Validation for discountPercentage with maxDiscountAmount
    if (discountPercentage && !maxDiscountAmount) {
      return res.status(400).json({
        success: false,
        message: "maxDiscountAmount is required when discountPercentage is provided.",
      });
    }

    const data = {
      name: couponName,
      startDate: new Date(startDate + "T00:00:00"),
      expireOn: new Date(endDate + "T00:00:00"),
      offerPrice: offerPrice ? parseInt(offerPrice) : null,
      discountPercentage: discountPercentage ? parseInt(discountPercentage) : null,
      maxDiscountAmount: maxDiscountAmount ? parseInt(maxDiscountAmount) : null,
      minimumPrice: parseInt(minimumPrice),
    };

    const existingCoupon = await Coupon.find({
      name: { $regex: `^${data.name}$`, $options: 'i' },
    });

    if (existingCoupon.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Coupon with this name already exists.",
      });
    }

    const newCoupon = new Coupon(data);
    const savedCoupon = await newCoupon.save();

    if (savedCoupon) {
      return res.status(200).json({
        success: true,
        message: "Coupon added successfully!",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Failed to add coupon.",
      });
    }
  } catch (error) {
    next(error);
  }
};

const editCoupon = async (req, res, next) => {
  try {
    const couponId = req.query.id;

    const name = req.body.name?.trim();
    const startDate = new Date(req.body.createdOn + "T00:00:00");
    const endDate = new Date(req.body.expireOn + "T00:00:00");
    const offerPrice = req.body.offerPrice ? parseFloat(req.body.offerPrice) : null;
    const discountPercentage = req.body.discountPercentage ? parseFloat(req.body.discountPercentage) : null;
    const maxDiscountAmount = req.body.maxDiscountAmount ? parseFloat(req.body.maxDiscountAmount) : null;
    const minimumPrice = parseFloat(req.body.minimumPrice);

    // // Validation
    // if (!name || !startDate || !endDate || !minimumPrice || isNaN(minimumPrice)) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     success: false,
    //     message: Messages.INVALID_COUPON_DATA,
    //   });
    // }

    // if (endDate <= startDate) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     success: false,
    //     message: Messages.COUPON_DATE_INVALID,
    //   });
    // }

    // if (!offerPrice && !discountPercentage) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     success: false,
    //     message: Messages.COUPON_DISCOUNT_REQUIRED,
    //   });
    // }

    // if (discountPercentage && !maxDiscountAmount) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     success: false,
    //     message: Messages.COUPON_MAX_AMOUNT_REQUIRED,
    //   });
    // }

    // if (offerPrice && discountPercentage) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     success: false,
    //     message: Messages.COUPON_TYPE_CONFLICT,
    //   });
    // }

    // Check if coupon name already exists
    const existingCoupon = await Coupon.find({
      name: { $regex: `^${name}$`, $options: 'i' },
      _id: { $ne: couponId },
    });

    if (existingCoupon.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.COUPON_EXISTS,
      });
    }

    const newCoupon = {
      name,
      createdOn: startDate,
      expireOn: endDate,
      offerPrice: offerPrice || null,
      discountPercentage: discountPercentage || null,
      maxDiscountAmount: discountPercentage ? maxDiscountAmount : null,
      minimumPrice,
    };

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, newCoupon, {
      new: true,
    });

    if (updatedCoupon) {
      return res.status(StatusCodes.SUCCESS).json({
        success: true,
        message: Messages.COUPON_UPDATED_SUCCESSFULLY,
      });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.COUPON_UPDATE_FAILED,
      });
    }
  } catch (error) {
    next(error);
  }
};


const deleteCoupon = async (req, res,next) => {
  try {
    const couponId = req.query.id;

    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (deletedCoupon) {
      return res.status(StatusCodes.SUCCESS).json({
        success: true,
        message: Messages.COUPON_DELETED,
      });      
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.COUPON_DELETE_FAILED,
      });
      
    }
  } catch (error) {
    next(error)
  }
};

module.exports = { 
  loadCoupon, 
  addCoupon, 
  editCoupon, 
  deleteCoupon,
};
