const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require("mongoose");
const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");


const loadCheckoutPage = async (req, res,next) => {
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
      return res.status(StatusCodes.NOT_FOUND).json({ status: false, message: Messages.USER_NOT_FOUND });
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

    if(cartItems.length>0){
    res.render("checkout", {
      user,
      cartItems,
      coupons,
      subtotal,
      grandTotal,
      userAddress: addressData,
      wallet: wallet || { balance: 0 },
    })}else{
      res.redirect('/cart')
    }

  } catch (error) {
    next(error)
  }
};

const addAddressCheckout = async (req, res,next) => {
  try {
    const user = req.session.user;

    res.render("addAddressCheckout", { user: user });
  } catch (error) {
    next(error)
  }
};

const saveAddressCheckout = async (req, res,next) => {
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
    next(error)
  }
};

const applyCoupon = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const { couponCode, subtotal } = req.body;


    const coupon = await Coupon.findOne({ name: couponCode, isListed: true });

    if (!coupon) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: Messages.INVALID_COUPON_CODE });
    }


    if (coupon.minimumPrice > subtotal) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.COUPON_MINIMUM_PRICE_REQUIRED(coupon.minimumPrice),
      });
    }

    if (coupon.usedBy.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.COUPON_ALREADY_USED,
      });
      
    }

    let discount = 0;

    if (coupon.offerPrice) {
      discount = coupon.offerPrice;
    }

    else if (coupon.discountPercentage) {
      discount = (subtotal * coupon.discountPercentage) / 100;


      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    }


    await Cart.findOneAndUpdate(
      { userId: userId },
      { $set: { discount: discount } },
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