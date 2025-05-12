const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");

const loadWishlist = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const cart = await Cart.findOne({ userId });

    const cartProductIds = cart ? cart.items.map((item) => item.productId) : [];

    const products = await Product.find({
      _id: { $in: user.wishlist, $nin: cartProductIds },
      isBlocked: false,
    })
      .populate("categoryId")
      .populate("brandId")
      .skip(skip)
      .limit(limit);
    const totalProducts = await Product.countDocuments({
      _id: { $in: user.wishlist, $nin: cartProductIds },
      isBlocked: false,
    });
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("wishlist", {
      user: user,
      wishlist: products,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const productId = req.body.productId;

    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: [
        { path: "brandId", model: "Brand" },
        { path: "categoryId", model: "Category" },
      ],
    });
    const specificItem = cart.items.find(
      (item) =>
        item.productId && item.productId._id.toString() === productId.toString()
    );

    if (specificItem) {
      return res
        .status(StatusCodes.SUCCESS)
        .json({ status: false, message: Messages.PRODUCT_ALREADY_IN_CART });
    } else if (user.wishlist.includes(productId)) {
      return res
  .status(StatusCodes.SUCCESS)
  .json({ status: false, message: Messages.PRODUCT_ALREADY_IN_WISHLIST });

    }
    user.wishlist.push(productId);
    await user.save();

    return res
  .status(StatusCodes.SUCCESS)
  .json({ status: true, message: Messages.PRODUCT_ADDED_TO_WISHLIST });

  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const productId = req.query.productId;

    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const index = user.wishlist.indexOf(productId);

    user.wishlist.splice(index, 1);

    await user.save();
    return res
  .status(StatusCodes.SUCCESS)
  .json({ success: true, message: Messages.PRODUCT_REMOVED_SUCCESSFULLY });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
};
