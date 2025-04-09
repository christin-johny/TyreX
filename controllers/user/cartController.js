const mongoose = require("mongoose");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Size = require("../../models/size");
const Brand = require("../../models/brandSchema");
const Cart = require("../../models/cartSchema"); 

const addToCart = async (req, res) => {
    try {
        
        const userId = req.session.user._id; 

        const { quantity } = req.body; 
        const productId = req.params.productId; 

        const wishlist = await User.findById(userId,{wishlist:1})


        const product = await Product.findOne({ _id: productId, isBlocked: false }).populate("categoryId",'isListed')

        if (!product||!product.categoryId.isListed) {
            return res.status(404).json({ message: "Product not currently available" });
        }

        
        let cart = await Cart.findOne({ userId });

        if (cart) {
            
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            
            if (itemIndex > -1) {
                if((cart.items[itemIndex].quantity + quantity)>product.quantity){
                    
                    return res.status(400).json({ success: false, message: `we have only ${product.quantity} in stock`});
                }
                if(cart.items[itemIndex].quantity + quantity>5){
                    return res.status(400).json({ success: false, message: "You have reached the maximum limit for this product in your cart." });
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
        


        

        res.status(200).json({ success: true, message: "Product added to cart", cart });

    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const loadCart = async (req, res) => {
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

       if(cart.discount>0){
        await Cart.findOneAndUpdate({userId},{$set:{discount:0}})
       }

        


        if (!cart || cart.items.length === 0) {
            return res.render("cart", { data: [], grandTotal: 0, user: req.session.user });
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
        console.error("Error fetching cart:", error);
        res.status(500).send("Server Error");
    }
};


const changeQuantity = async (req, res) => {
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
            return res.status(404).json({ message: "Cart not found" });
        }

     
        const specificItem = cart.items.find(item =>
            item.productId && item.productId._id.toString() === productId.toString()
        );

        if (!specificItem) {
            return res.status(404).json({ message: "Product not found in cart" });
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

        res.status(200).json({
            success: true,
            message: "Updated successfully",
            cartData,
            grandTotal
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const removeFromCart= async(req,res,next)=>{
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
            return res.status(404).json({ message: "Cart not found" });
        }

        const specificItem = cart.items.find(item =>
            item.productId && item.productId._id.toString() === productId.toString()
        );

        if (!specificItem) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        await Cart.updateOne(
            { userId }, 
            { $pull: { items: { productId: productId } } }
        );
        

        
        return res.status(200).json({success:true,message:'Product removed successfully'})
    } catch (error) {
        console.error("Error deleting product from wishlist", error);
        next(error);
    }
}

module.exports = { addToCart,loadCart,changeQuantity,removeFromCart};
