const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");


const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId, paymentMethod } = req.body;

    const userData = await User.findById(userId);

    const cart = await Cart.findOne({ userId });

    const cartItems = cart.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.totalPrice,
    }));

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    const finalAmount = totalPrice + 50;

    const invoiceDate = new Date();
    const status = "Processing";

    const orderSchema = new Order({
      userId: userId,
      orderedItems: cartItems,
      totalPrice: totalPrice,
      finalAmount: finalAmount,
      address: addressId,
      invoiceDate: invoiceDate,
      status: status,
      paymentMethod: paymentMethod,
    });
    await orderSchema.save();

    await User.findByIdAndUpdate(
      userId,
      { $push: { orders: orderSchema._id } },
      { new: true }
    );

    const orderedItems = cart.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
    }));
    for (let i = 0; i < orderedItems.length; i++) {
      await Product.findByIdAndUpdate(orderedItems[i].product, {
        $inc: { quantity: -orderedItems[i].quantity },
      });
    }

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    return res
      .status(200)
      .json({ success: true, message: "Order placed successfully" });
  } catch (error) {}
};

const loadConfirmation = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const orderData = await User.findById(userId, { orders: 1 }).populate(
      "orders"
    );

    const data = orderData.orders.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const orderId = data[0].orderId;
    res.render("orderConfirmation", { orderId: orderId });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const orders = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId: userId }).populate(
      "orderedItems.product"
    )
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)
    

    const totalOrders = await Order.countDocuments({userId:userId});
    const totalPages = Math.ceil(totalOrders/limit);



    res.render("viewOrders", {
      user: user, 
      orders: orders,
      currentPage:page,
      totalPages:totalPages,
     });

  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const orderDetails = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const orderId = req.query.orderId;

    let orders = await Order.findOne({ orderId: orderId })
      .populate("orderedItems.product")
      .lean();

    const addressDoc = await Address.findOne({ userId: userId }).lean();

    const userAddress = addressDoc.address.find(
      (addr) => addr._id.toString() === orders.address.toString()
    );

    orders.address = userAddress;

    res.render("orderDetails", {
      order: orders,
      user: user,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const user = req.session.user;
    const { orderId, reason } = req.body;
    console.log(orderId, reason);

    const order = await Order.findById(orderId);

    await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "cancelled", cancelReason: reason } },
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
};

const downloadInvoice = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const orderId = req.query.orderId;

    let order = await Order.findOne({ orderId: orderId })
      .populate("orderedItems.product")
      .lean();

    const addressDoc = await Address.findOne({ userId: userId }).lean();

    const userAddress = addressDoc.address.find(
      (addr) => addr._id.toString() === order.address.toString()
    );
    console.log(userAddress);
    order.address = userAddress;

    console.log(order);

    res.render("invoice", { order: order, user: user });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const requestReturn = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { orderId, returnReason, returnDescription } = req.body;
    const images = req.files.map((items) => items.filename);

    const user = await User.findById(userId);

    if (user.orders.includes(orderId)) {
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          status: "return requested",
          requestStatus:'pending',
          returnReason: returnReason,
          returnDescription: returnDescription,
          returnImage: images,
        },
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Order not Found" });
    }

    return res.status(200).json({ success: true, message: "returned" });
  } catch (error) {
    console.error(error);
    res.render("/pageNotFound");
  }
};


const orderSearch=async (req,res) => {

  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const search= req.body.query;
    console.log(search);

    const orders = await Order.find({ orderId: search }).populate(
      "orderedItems.product"
    );
    if(orders){
     return res.render("viewOrders", {user: user, orders: orders,currentPage:0,totalPages:0 });
    }else{
      return res.render("viewOrders", {user: {}, orders: {} });
    }
    
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }

  
  
}

const cancelReturnRequest=async (req,res)=>{
  try {
    const userId = req.session.user._id;
    const { orderId} = req.body;


    const user = await User.findById(userId);

    if (user.orders.includes(orderId)) {
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          status: 'delivered',
          requestStatus: '',
          returnReason: '',
          returnDescription: '',
          returnImage: [],
        },
      });
      
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Order not Found" });
    }

    return res.status(200).json({ success: true, message: "return request cancelled" });
  } catch (error) {
    console.error(error);
    res.render("/pageNotFound");
  }
}


module.exports = {
  loadConfirmation,
  placeOrder,
  orders,
  orderDetails,
  cancelOrder,
  downloadInvoice,
  requestReturn,
  orderSearch,
  cancelReturnRequest,

};
