const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Address = require("../../models/addressSchema");
const Cart =require('../../models/cartSchema')
const mongoose = require('mongoose')
// const Coupon = require("../../models/couponSchema");
const Wallet = require("../../models/walletSchema");

const loadCheckoutPage = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user=await User.findById(userId)

  
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
        
        
      const wallet = await Wallet.findOne({ userId: userId });

        const addressData = await Address.findOne({ userId: userId });
  
        if (!user) {
            return res.status(404).send("User not found");
        }
  
        for (let item of cart.items) {
            if (item.productId && item.quantity > item.productId.quantity) {
                item.quantity = item.productId.quantity;
                if (item.quantity === 0) {
                    cart.items = cart.items.filter(cartItem => cartItem.productId.toString() !== item.productId.toString());
                }
            }
        }
        await cart.save();
  
           const cartItems = cart.items
            .filter(item => 
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
  
        const subtotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
        let grandTotal=0;
        if(subtotal<15000){
        grandTotal = subtotal + 500;
        }else{
          grandTotal = subtotal
        }

  
        res.render("checkout", {
            user,
            cartItems,
            subtotal,
            grandTotal,
            userAddress: addressData,
           wallet:wallet|| { balance: 0},
        });
    } catch (error) {
        console.error("Error in loadCheckoutPage:", error);
        res.redirect("/pageNotFound");
    }
  };

const addAddressCheckout = async (req, res) => {
    
    try {
        const user = req.session.user;
  
        res.render('addAddressCheckout', { user: user });
    } catch (error) {
        res.redirect('/pageNotFound');
    }
};

const saveAddressCheckout = async (req, res) => {
    try {
        const userId = req.session.user._id;
  
        if (mongoose.isValidObjectId(userId)) {
            const userData = await User.findOne({ _id: userId });
            const { addressType, name, apartment, building, street, city, landmark, state, country, zip, phone, altPhone } = req.body;
            
            const userAddress = await Address.findOne({ userId: userData._id });
            if (!userAddress) {
                const newAddress = new Address({
                    userId: userData._id,
                    address: [{
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
                        altPhone
                    }]
                });
                await newAddress.save();
                
            } else {
                userAddress.address.push({ addressType, name, apartment, building, street, city, landmark, state, country, zip, phone, altPhone });
                await userAddress.save();
                
            }
  
            res.redirect("/checkout");
        }
  
  
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound');
    }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.session.user;

    const coupon = await Coupon.findOne({ name: couponCode, isList: true });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon code" });
    }

    if (new Date() > coupon.expireOn) {
      return res.json({ success: false, message: "Coupon has expired" });
    }

    if (subtotal < coupon.minimumPrice) {
      return res.json({
        success: false,
        message: `Minimum purchase amount should be ₹${coupon.minimumPrice}`,
      });
    }

    if (coupon.userId.includes(userId)) {
      return res.json({
        success: false,
        message: "You have already used this coupon",
      });
    }

    res.json({ success: true, coupon: coupon });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while applying the coupon",
      });
  }
};

const checkStock = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId).populate({
      path: "cart.productId",
      model: "Product",
    });

    if (!user || !user.cart.length) {
      return res.json({
        success: false,
        message: "Cart is empty",
      });
    }

    const stockChanges = user.cart.map((item) => {
      const product = item.productId;
      const requestedQty = item.quantity;
      const availableQty = product.quantity;

      return {
        productId: product._id,
        stockChanged: requestedQty > availableQty,
        availableQty: availableQty,
        requestedQty: requestedQty,
      };
    });

    // Update cart quantities if needed
    for (const item of stockChanges) {
      if (item.stockChanged) {
        await User.updateOne(
          {
            _id: userId,
            "cart.productId": item.productId,
          },
          {
            $set: {
              "cart.$.quantity": item.availableQty,
            },
          }
        );
      }
    }

    res.json({
      success: true,
      items: stockChanges,
    });
  } catch (error) {
    console.error("Error checking stock:", error);
    res.status(500).json({
      success: false,
      message: "Error checking stock availability",
    });
  }
};

module.exports = {
  loadCheckoutPage,
  addAddressCheckout,
  saveAddressCheckout,
  applyCoupon,
  checkStock,
};
