const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");

const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const cart = await Cart.findOne({ userId });

    const cartProductIds = cart.items.map((item) => item.productId);

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
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const addToWishlist = async (req, res) => {
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
        .status(400)
        .json({ status: false, message: "Product already in cart!" });
    } else if (user.wishlist.includes(productId)) {
      return res
        .status(400)
        .json({ status: false, message: "Product already in wishlist!" });
    }

    user.wishlist.push(productId);
    await user.save();

    return res
      .status(200)
      .json({ status: true, message: "Product added to wishlist" });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
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
      .status(200)
      .json({ success: true, message: "Product removed successfully!" });
  } catch (error) {
    console.error("Error deleting product from wishlist", error);
    next(error);
  }
};

module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
};
