const mongoose = require("mongoose");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Size = require("../../models/size");
const Brand = require("../../models/brandSchema");
const Cart = require("../../models/cartSchema"); 
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");

const addToCart = async (req, res,next) => {
    try {
        
        const userId = req.session.user._id; 

        const { quantity } = req.body; 
        const productId = req.params.productId; 

        const wishlist = await User.findById(userId,{wishlist:1})


        const product = await Product.findOne({ _id: productId, isBlocked: false }).populate("categoryId",'isListed')

        if (!product||!product.categoryId.isListed) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: Messages.PRODUCT_NOT_AVAILABLE,
              });              
        }

        
        let cart = await Cart.findOne({ userId });

        if (cart) {
            
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            
            if (itemIndex > -1) {
                if((cart.items[itemIndex].quantity + quantity)>product.quantity){
                    
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        success: false,
                        message: Messages.ONLY_STOCK_AVAILABLE(product.quantity),
                    });                      
                }
                if(cart.items[itemIndex].quantity + quantity>5){
                    return res.status(StatusCodes.BAD_REQUEST).json({
                        success: false,
                        message: Messages.MAX_CART_LIMIT_REACHED,
                      });                      
                }
                else{
                cart.items[itemIndex].quantity += quantity;
                cart.items[itemIndex].totalPrice = cart.items[itemIndex].quantity * cart.items[itemIndex].price;
                }

            } else {
                
                cart.items.push({
                    productId,
                    quantity,
                    price: product.salePrice,
                    totalPrice: quantity * product.salePrice,
                });
            }
        } else {
            
            cart = new Cart({
                userId,
                items: [
                    {
                        productId,
                        quantity,
                        price: product.salePrice,
                        totalPrice: quantity * product.salePrice,
                    },
                ],
            });
        }

        await cart.save(); 

        const userCart = await User.findOne({ _id: userId }, { cart: 1 });

        if (!userCart || userCart.cart.length === 0) {
            await User.findByIdAndUpdate(userId, { $set: { cart: [cart._id] } }, { new: true });
        }
        res.status(StatusCodes.SUCCESS).json({
            success: true,
            message: Messages.PRODUCT_ADDED_TO_CART,
            cart,
          });          

    } catch (error) {
        next(error)
    }
};

const loadCart = async (req, res,next) => {
    try {
        const userId = req.session.user._id; 

       
        const cart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            populate:[ {
                path: "brandId",
                model: "Brand"
            },
            {
                path:'categoryId',
                model:'Category'
            }]
        });


        if (!cart || cart.items.length === 0) {
            return res.render("cart", { data: [], grandTotal: 0, user: req.session.user });
        }
        if(cart.discount && cart.discount>0){
            await Cart.findOneAndUpdate({userId},{$set:{discount:0}})
           }
    
        
        const cartData = cart.items.filter(item => item.productId && item.productId.isBlocked === false)
        .map(item => ({
            productDetails: item.productId, 
            quantity: item.quantity
        }));


        let grandTotal = cart.items.filter(item => item.productId && item.productId.isBlocked === false)
        .reduce((acc, item) => {
            return acc + (item.productId?.salePrice || 0) * item.quantity; 
        }, 0);

        res.render("cart", { data: cartData, grandTotal, user: req.session.user });


    } catch (error) {
        next(error)
    }
};

const changeQuantity = async (req, res,next) => {
    try {
        const userId = req.session.user._id;
        const { productId, count } = req.body;

        const cart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            populate: [
                { path: "brandId", model: "Brand" },
                { path: "categoryId", model: "Category" }
            ]
        });

        if (!cart) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: Messages.CART_NOT_FOUND,
              });              
        }

     
        const specificItem = cart.items.find(item =>
            item.productId && item.productId._id.toString() === productId.toString()
        );

        if (!specificItem) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: Messages.PRODUCT_NOT_IN_CART,
              });              
        }

     
        specificItem.quantity += count;
        specificItem.totalPrice=specificItem.quantity*specificItem.price;

        if (specificItem.quantity < 1) {
            specificItem.quantity = 1;
        }
        await cart.save();


        const cartData = cart.items.map(item => ({
            productDetails: item.productId,
            quantity: item.quantity
        }));

        let grandTotal = cart.items.reduce((acc, item) => {
            return acc + ((item.productId?.salePrice || 0) * item.quantity);
        }, 0);

        res.status(StatusCodes.SUCCESS).json({
            success: true,
            message: Messages.CART_UPDATED,
            cartData,
            grandTotal,
          });          

    } catch (error) {
        next(error)
    }
};

const removeFromCart = async(req, res, next) => {
    try {
        const productId = req.query.productId;
        const userId = req.session.user._id;  

        const cart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            populate: [
                { path: "brandId", model: "Brand" },
                { path: "categoryId", model: "Category" }
            ]
        });

        if (!cart) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: Messages.CART_NOT_FOUND });
        }

        const specificItem = cart.items.find(item =>
            item.productId && item.productId._id.toString() === productId.toString()
        );

        if (!specificItem) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: Messages.PRODUCT_NOT_IN_CART });
        }

        await Cart.updateOne(
            { userId }, 
            { $pull: { items: { productId: productId } } }
        );

        const updatedCart = await Cart.findOne({ userId }).populate({
            path: "items.productId",
            populate: [
                { path: "brandId", model: "Brand" },
                { path: "categoryId", model: "Category" }
            ]
        });

        let grandTotal = 0;
        if (updatedCart && updatedCart.items.length > 0) {
            grandTotal = updatedCart.items.reduce((acc, item) => {
                return acc + ((item.productId?.salePrice || 0) * item.quantity);
            }, 0);
        }
        return res.status(StatusCodes.SUCCESS).json({ 
            success: true, 
            message: Messages.PRODUCT_REMOVED,
            grandTotal
        });
    } catch (error) {
        next(error);
    }
}

const validateCheckout = async (req, res, next) => {
    try {
      const userId = req.session.user._id;
      const cart = await Cart.findOne({ userId }).populate("items.productId");
  
      if (!cart || !cart.items.length) {
        return res.status(400).json({ status: false, message: "Your cart is empty." });
      }
  
      for (let item of cart.items) {
        const product = item.productId;
        if (!product || product.isBlocked || product.quantity < item.quantity) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: false,
            message: Messages.INSUFFICIENT_STOCK(product?.productName || 'Unknown', product.quantity),
          });
          
        }
      }
  
      return res.status(200).json({ status: true });
  
    } catch (error) {
      next(error);
    }
  };
  

module.exports = { addToCart,loadCart,changeQuantity,removeFromCart,validateCheckout};
