const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
  orderId: {
    type: String,
    default: () => uuidv4(),
    unique: true,
  },
  userId:{
    type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
  },
  orderedItems: [{
    product: {
      _id: Schema.Types.ObjectId,
      productName: String,
      description: String,
      categoryId: Schema.Types.ObjectId,
      productNumber: String,
      regularPrice: Number,
      salePrice: Number,
      productOffer: Number,
      quantity: Number,
      warranty: String,
      isBlocked: Boolean,
      productImage: [String],
      status: String,
      brandId: Schema.Types.ObjectId,
      sizeId: Schema.Types.ObjectId,
    },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        default: 0,
      },
    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address: {
      addressType: { type: String, required: true },
      name: { type: String, required: true },
      apartment: { type: String, required: true },
      building: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      landmark: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zip: { type: String, required: true },
      phone: { type: String, required: true },
      altPhone: { type: String, required: true },
    },    
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Processing','Shipped','delivered','cancelled','return requested','returned','returning'],
        default: 'Pending'
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Failed'
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    cancelReason:{
      Type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    paymentMethod:{
      type:String,
      required:true,
      enum:['cod','wallet','online payment']

    },
    deliveredAt:{
      type:Date,
      default:Date.now,
    },
    requestStatus:{
      type:String,
      enum:['pending','approved','rejected']
    },
    returnReason:{
      type:String,
    },
    returnDescription:{
      type:String,
    },
    returnImage:[{
      type:String,
    }],
    rejectionCategory:{
      type:String
    },
    rejectionReason:{
      type:String
    },
    updatedAt:{
      type: Date,
    }
});


const Order = mongoose.model("Order",orderSchema);

module.exports = Order;
