const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");


const loadOrders=async (req,res) => {
    try {

        const orders = await Order.find().populate('userId').sort({createdAt:-1})
        if(orders){

        
        res.render('orders',{
            orders:orders,
            title:'Order Management'
        });
    }else{
        return res.status(400).json({success:false,message:'order not found'})}

    } catch (error) {
        console.error(error);
        res.render('pageerror')
    }
    
}

const viewOrderDetails=async (req,res) => {
    try {
    
    const id=req.params.id;
    console.log(id)

    const order= await Order.findById(id).populate('orderedItems.product')
    .populate('userId').lean();
    

    if(order){

        const userId=order.userId
    const addressDoc = await Address.findOne({ userId: userId }).lean();
    
        const userAddress = addressDoc.address.find(
          (addr) => addr._id.toString() === order.address.toString()
        );
        
        order.address = userAddress;
        console.log(order.address)

        res.render('adminOrderDetails',{order:order})
    }else{
        return res.status(400).json({success:false,message:'order not found'})
    }


    
        
    } catch (error) {
        
    }
   

    
}

const updateStatus= async (req,res) => {
    try {
        const{orderId, status}=req.body;

        const order = await Order.findByIdAndUpdate(orderId,{$set:{status:status}},{new:true});
        if(order){
            return res.status(200).json({success:true,message:"order updated successfully"});
        }else{
            return res.status(400).json({success:false,message:"order not found"});
        }
    } catch (error) {
        console.error(error);
        res.render('pageerror');
    }
}


const orderCancel = async (req,res) => {
    try {
        const { orderId} = req.body;
    
        const order = await Order.findById(orderId);
    
        await Order.findOneAndUpdate(
          { _id: orderId },
          { $set: { status: "cancelled"} },
          { new: true }
        );
    
        const orderedItems = order.orderedItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        }));
    
        console.log(orderedItems);
        for (let i = 0; i < orderedItems.length; i++) {
          await Product.findByIdAndUpdate(orderedItems[i].product, {
            $inc: { quantity: orderedItems[i].quantity },
          });
        }
    
        return res
          .status(200)
          .json({ success: true, message: "Order cancelled successfully" });
      } catch (error) {
        console.error(error);
        res.redirect("/pageNotFound");
      }
    
}



module.exports={
    loadOrders,
    viewOrderDetails,
    updateStatus,
    orderCancel,


}