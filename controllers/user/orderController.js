const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Coupon = require("../../models/couponSchema")
const Wallet = require("../../models/walletSchema");
const razorpay = require("../../config/razorpay");
const crypto = require("crypto");

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId, paymentMethod,couponCode } = req.body;
    
    const addressData = await Address.findOne(
      { userId: userId, "address._id": addressId },
      { "address.$": 1 } 
    ).lean();
    
    if (!addressData || !addressData.address || addressData.address.length === 0) {
      throw new Error("Address not found");
    }
    
    const selectedAddress = addressData.address[0]; 

    const userData = await User.findById(userId);

    const cart = await Cart.findOne({ userId });

const cartItems = await Promise.all(cart.items.map(async (item) => {
  const product = await Product.findById(item.productId).lean(); 
  return {
    product: product, 
    quantity: item.quantity,
    price: item.totalPrice,
  };
}));


const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

let finalAmount = totalPrice < 15000 ? totalPrice + 500 - cart.discount : totalPrice - cart.discount;

if(finalAmount>15000){
  return res
      .status(400)
      .json({ success: false, message: "Cash on delivery is not applicable for amount above ₹15000! " });
}

    const invoiceDate = new Date();
    const status = "Processing";

    const orderSchema = new Order({
      userId: userId,
      orderedItems: cartItems,
      totalPrice: totalPrice,
      finalAmount: finalAmount,
      address: selectedAddress,
      invoiceDate: invoiceDate,
      status: status,
      paymentMethod: paymentMethod,
      discount:cart.discount
    });
    await orderSchema.save();

    if(couponCode){
    await Coupon.findOneAndUpdate(
      { name: couponCode },
      { $addToSet: { usedBy: userId } }
    );
  }
    

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

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [],discount:0} });

    return res
      .status(200)
      .json({ success: true, message: "Order placed successfully" });
  } catch (error) {}
};

const placeWalletOrder = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const { addressId, paymentMethod,couponCode } = req.body;

    const addressData = await Address.findOne(
      { userId: userId, "address._id": addressId },
      { "address.$": 1 } // Project only the matching address in the array
    ).lean();
    
    if (!addressData || !addressData.address || addressData.address.length === 0) {
      throw new Error("Address not found");
    }
    
    const selectedAddress = addressData.address[0]; 

    const userData = await User.findById(userId);

    const cart = await Cart.findOne({ userId });

const cartItems = await Promise.all(cart.items.map(async (item) => {
  const product = await Product.findById(item.productId).lean(); 
  return {
    product: product, 
    quantity: item.quantity,
    price: item.totalPrice,
  };
}));


const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
let finalAmount = totalPrice < 15000 ? totalPrice + 500 - cart.discount : totalPrice - cart.discount;

    const invoiceDate = new Date();
    const status = "Processing";

    let wallet = await Wallet.findOne({ userId: userId });

    if (wallet.balance < finalAmount) {
      return res
        .status(400)
        .json({
          success: false,
          message: `you only have ₹ ${wallet.balance} in your wallet!`,
        });
    }

    if (!wallet) {
      return res
        .status(400)
        .json({ success: false, message: "Wallet not Found" });
    }

    wallet.balance -= parseInt(finalAmount);
    wallet.transactions.push({
      amount:finalAmount,
      type: "debit",
      description: "Deducted for purchase",
    });
    await wallet.save();

    const orderSchema = new Order({
      userId: userId,
      orderedItems: cartItems,
      totalPrice: totalPrice,
      finalAmount: finalAmount,
      address: selectedAddress,
      invoiceDate: invoiceDate,
      status: status,
      paymentMethod: paymentMethod,
      discount:cart.discount
    });
    await orderSchema.save();

    if(couponCode){
      await Coupon.findOneAndUpdate(
        { name: couponCode },
        { $addToSet: { usedBy: userId } }
      );
    }

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

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [],discount:0 } });

    return res
      .status(200)
      .json({ success: true, message: "Order placed successfully" });

  } catch (error) {
    next(error);
  }
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

    const orders = await Order.find({ userId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId: userId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.render("viewOrders", {
      user: user,
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
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
      .lean();
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

    const order = await Order.findById(orderId);
    if(order.paymentMethod!='cod'){
      let wallet = await Wallet.findOne({ userId: user._id });

      if (!wallet) {
        wallet = new Wallet({ userId:user._id, balance: 0, transactions: [] });
      }

      wallet.balance += parseInt(order.finalAmount);
    wallet.transactions.push({
      amount:order.finalAmount,
      type: "credit",
      description: "Order cancellation Refund",
    });
    await wallet.save();

    }

    await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "cancelled", cancelReason: reason } },
      { new: true }
    );

    const orderedItems = order.orderedItems.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));

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
      .lean();


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
          requestStatus: "pending",
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

const orderSearch = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const search = req.body.query;

    const orders = await Order.find({ orderId: search }).populate(
      "orderedItems.product"
    );
    if (orders) {
      return res.render("viewOrders", {
        user: user,
        orders: orders,
        currentPage: 0,
        totalPages: 0,
      });
    } else {
      return res.render("viewOrders", { user: {}, orders: {} });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const cancelReturnRequest = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { orderId } = req.body;

    const user = await User.findById(userId);

    if (user.orders.includes(orderId)) {
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          status: "delivered",
          requestStatus: "",
          returnReason: "",
          returnDescription: "",
          returnImage: [],
        },
      });
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Order not Found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "return request cancelled" });
  } catch (error) {
    console.error(error);
    res.render("/pageNotFound");
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    

    const userData = await User.findById(userId);
    const cart = await Cart.findOne({ userId });

    const cartItems = cart.items.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.totalPrice,
    }));

    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    let finalAmount = totalPrice < 15000 ? totalPrice + 500 - cart.discount: totalPrice - cart.discount;

    const options = {
      amount: finalAmount * 100, 
      currency: "INR",
      receipt: `txn_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    
    res.status(200).json({
      id: order.id, 
      amount: options.amount, 
      currency: options.currency,
    });
  } catch (error) {
    next(error);
  }
};


const verifyPayment = async (req, res, next) => {
  try {
   
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const { addressId, paymentMethod,couponCode } = req.body;
  
    const userId = req.session.user._id;
     
    
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    const addressData = await Address.findOne(
      { userId: userId, "address._id": addressId },
      { "address.$": 1 } // Project only the matching address in the array
    ).lean();
    
    if (!addressData || !addressData.address || addressData.address.length === 0) {
      throw new Error("Address not found");
    }
    
    const selectedAddress = addressData.address[0]; 

    const userData = await User.findById(userId);

    const cart = await Cart.findOne({ userId });

const cartItems = await Promise.all(cart.items.map(async (item) => {
  const product = await Product.findById(item.productId).lean(); 
  return {
    product: product, 
    quantity: item.quantity,
    price: item.totalPrice,
  };
}));


const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
let finalAmount = totalPrice < 15000 ? totalPrice + 500 - cart.discount : totalPrice - cart.discount;

    

    const invoiceDate = new Date();
    const status = "Processing";

    const orderSchema = new Order({
      userId: userId,
      orderedItems: cartItems,
      totalPrice: totalPrice,
      finalAmount: finalAmount,
      address: selectedAddress,
      invoiceDate: invoiceDate,
      status: status,
      paymentMethod: paymentMethod,
      discount:cart.discount
    });
    await orderSchema.save();
    
    if(couponCode){
      await Coupon.findOneAndUpdate(
        { name: couponCode },
        { $addToSet: { usedBy: userId } }
      );
    }

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

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [],discount:0 } });


    res.status(200).json({ success: true, message: "Payment successful" });
  } catch (error) {
    next(error);
  }
};



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
  placeWalletOrder,
  createOrder,
  verifyPayment
};
