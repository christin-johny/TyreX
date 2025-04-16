const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    productNumber:{
      type:String,
      required:true
    },
    regularPrice: {
      type: Number,
      required: true,
    },
    salePrice: {
      type: Number,
      required: true,
    },
    productOffer: {
      type: Number,
      default: 0,
    },
    categoryOffer:{
      type:Number,
      default:0
    },
    quantity: {
      type: Number,
      default: 0,
    },
    warranty: {
      type: String,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    productImage: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "out of stock", "Discountinued"],
      required: true,
      default: "Available",
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    sizeId:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"Size"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
