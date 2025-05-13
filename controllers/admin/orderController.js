const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const Wallet = require("../../models/walletSchema");
const StatusCodes = require("../../helpers/stausCodes");
const Messages = require("../../helpers/messages");

const loadOrders = async (req, res,next) => {
  try {
    let search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    let sortField = req.query.sortField || "createdAt";
    let sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    let filter = {};
    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "userId.name": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(filter)
      .populate("userId")
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / limit);

    res.render("orders", {
      orders,
      search,
      currentPage: page,
      totalPages,
      sortField,
      sortOrder,
      status: req.query.status || "all",
    });
  } catch (error) {
    next(error)
  }
};

const viewOrderDetails = async (req, res ,next) => {
  try {
    const id = req.params.id;

    const order = await Order.findById(id)
      .lean();

    if (order) {
      res.render("adminOrderDetails", { order: order });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.ORDER_NOT_FOUND,
      });
      
    }
  } catch (error) {
    next(error)
  }
};

const updateStatus = async (req, res,next) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { status: status } },
      { new: true }
    );
    if (order) {
      return res.status(StatusCodes.SUCCESS).json({
        success: true,
        message: Messages.ORDER_UPDATED_SUCCESSFULLY,
      });
      
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: Messages.ORDER_NOT_FOUND,
      });
      
    }
  } catch (error) {
  next(error)
  }
};

const orderCancel = async (req, res,next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
        if(order.paymentMethod!='cod' && order.paymentStatus != 'Failed'){
          let wallet = await Wallet.findOne({ userId: order.userId });
    
          if (!wallet) {
            wallet = new Wallet({ userId:order.userId, balance: 0, transactions: [] });
          }
    
          wallet.balance += parseInt(order.finalAmount);
        wallet.transactions.push({
          amount:order.finalAmount,
          type: "credit",
          description: "Order cancellation Refund",
          orderId:order._id,
        });
        await wallet.save();
    
        }

    await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "cancelled" } },
      { new: true }
    );

    const orderedItems = order.orderedItems.map((item) => ({
      product: item.product,
      quantity: item.quantity,
    }));

    for (let i = 0; i < orderedItems.length; i++) {
      await Product.findByIdAndUpdate(orderedItems[i].product._id, {
        $inc: { quantity: orderedItems[i].quantity },
      });
    }

    return res.status(StatusCodes.SUCCESS).json({
      success: true,
      message: Messages.ORDER_CANCELLED_SUCCESSFULLY,
    });
    
  } catch (error) {
    next(error)
  }
};

const handleReturn = async (req, res,next) => {
  try {
    const { action } = req.body;
    if (action === "approved") {
      const { orderId } = req.body;

      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { requestStatus: action } },
        { new: true }
      );
      if (order) {
        return res.status(StatusCodes.SUCCESS).json({
          success: true,
          message: Messages.RETURN_APPROVED_SUCCESSFULLY,
        });
        
      } else {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: Messages.ORDER_NOT_FOUND,
        });        
      }
    } else if (action === "rejected") {
      const { orderId, category, message } = req.body;

      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            requestStatus: action,
            rejectionCategory: category,
            rejectionReason: message,
          },
        },
        { new: true }
      );
      if (order) {
        return res.status(StatusCodes.OK).json({
          success: true,
          message: Messages.RETURN_REQUEST_REJECTED,
        });
        
      } else {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: Messages.ORDER_NOT_FOUND,
        });
        
      }
    }
  } catch (error) {
    next(error)
  }
};

const updateReturnStatus = async (req, res,next) => {
  try {
    const { orderId, status } = req.body;
    if (status === "returning") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status: status, updatedAt: new Date() } },
        { new: true }
      );
      if (order) {
        return res.status(StatusCodes.SUCCESS).json({
          success: true,
          message: Messages.RETURN_SUCCESSFUL,
        });
        
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: Messages.ORDER_NOT_FOUND,
        });
        
      }
    } else if (status === "returned") {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: { status: status, updatedAt: new Date() },
        },
        { new: true }
      );

      const orderData = await Order.findById(orderId);
      const userId = orderData.userId;

      let wallet = await Wallet.findOne({ userId: userId });
      if (!wallet) {
        wallet = new Wallet({ userId, balance: 0, transactions: [] });
      }

      wallet.balance += parseInt(orderData.finalAmount);

      wallet.transactions.push({
        amount:orderData.finalAmount,
        type: "credit",
        description: "Order return Refund",
        orderId:orderData._id
      });

      await wallet.save();
  
      const orderedItems = order.orderedItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      }));
  
      for (let i = 0; i < orderedItems.length; i++) {
        await Product.findByIdAndUpdate(orderedItems[i].product._id, {
          $inc: { quantity: orderedItems[i].quantity },
        });
      }

      if (order) {
        return res.status(StatusCodes.SUCCESS).json({
          success: true,
          message: Messages.RETURNED_SUCCESSFULLY,
        });
        
      } else {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: Messages.ORDER_NOT_FOUND,
        });        
      }
    }
  } catch (error) {
    next(error)
  }
};

module.exports = {
  loadOrders,
  viewOrderDetails,
  updateStatus,
  orderCancel,
  handleReturn,
  updateReturnStatus,
};
