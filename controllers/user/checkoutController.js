const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require("mongoose");
const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema");

const loadCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: [
        {
          path: "brandId",
          model: "Brand",
        },
        {
          path: "categoryId",
          model: "Category",
        },
      ],
    });

    const coupons = await Coupon.find({ isListed: true });

    const wallet = await Wallet.findOne({ userId: userId });

    const addressData = await Address.findOne({ userId: userId });

    if (!user) {
      return res.status(404).send("User not found");
    }

    for (let item of cart.items) {
      if (item.productId && item.quantity > item.productId.quantity) {
        item.quantity = item.productId.quantity;
        if (item.quantity === 0) {
          cart.items = cart.items.filter(
            (cartItem) =>
              cartItem.productId.toString() !== item.productId.toString()
          );
        }
      }
    }
    await cart.save();

    const cartItems = cart.items
      .filter(
        (item) =>
          item.productId &&
          !item.productId.isBlocked &&
          item.productId.categoryId &&
          item.productId.categoryId.isListed &&
          item.productId.quantity > 0
      )
      .map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        totalPrice: item.productId.salePrice * item.quantity,
      }));

    const subtotal = cartItems.reduce(
      (total, item) => total + item.totalPrice,
      0
    );
    let grandTotal = 0;
    if (subtotal < 15000) {
      grandTotal = subtotal + 500;
    } else {
      grandTotal = subtotal;
    }

    res.render("checkout", {
      user,
      cartItems,
      coupons,
      subtotal,
      grandTotal,
      userAddress: addressData,
      wallet: wallet || { balance: 0 },
    });
  } catch (error) {
    console.error("Error in loadCheckoutPage:", error);
    res.redirect("/pageNotFound");
  }
};

const addAddressCheckout = async (req, res) => {
  try {
    const user = req.session.user;

    res.render("addAddressCheckout", { user: user });
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const saveAddressCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;

    if (mongoose.isValidObjectId(userId)) {
      const userData = await User.findOne({ _id: userId });
      const {
        addressType,
        name,
        apartment,
        building,
        street,
        city,
        landmark,
        state,
        country,
        zip,
        phone,
        altPhone,
      } = req.body;

      const userAddress = await Address.findOne({ userId: userData._id });
      if (!userAddress) {
        const newAddress = new Address({
          userId: userData._id,
          address: [
            {
              addressType,
              name,
              apartment,
              building,
              street,
              city,
              landmark,
              state,
              country,
              zip,
              phone,
              altPhone,
            },
          ],
        });
        await newAddress.save();
      } else {
        userAddress.address.push({
          addressType,
          name,
          apartment,
          building,
          street,
          city,
          landmark,
          state,
          country,
          zip,
          phone,
          altPhone,
        });
        await userAddress.save();
      }

      res.redirect("/checkout");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const { couponCode, subtotal } = req.body;

    const coupon = await Coupon.findOne({ name: couponCode, isListed: true });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon code" });
    }
    if (coupon.minimumPrice > subtotal) {
      return res
        .status(400)
        .json({
          success: false,
          message: `You need to have items worth ${coupon.minimumPrice} to apply this coupon`,
        });
    }
    if (coupon.usedBy.includes(userId)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "You have already used this coupon.",
        });
    }
    await Cart.findOneAndUpdate(
      { userId: userId },
      { $set: { discount: coupon.offerPrice } },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Coupon applied", coupon });
  } catch (error) {
    next(error);
  }
};

const removeCoupon = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    await Cart.findOneAndUpdate(
      { userId: userId },
      { $set: { discount: 0 } },
      { new: true }
    );
    res.status(200).json({ success: true, message: "Coupon applied" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadCheckoutPage,
  addAddressCheckout,
  saveAddressCheckout,
  applyCoupon,
  removeCoupon,
};
