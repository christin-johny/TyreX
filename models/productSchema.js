const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    ProductName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    brand: {
      type: String,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
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
    quantity: {
      type: Number,
      default: 0,
    },
    warranty: {
      type: String,
    },
    sku: {
      type: String,
      unique: true,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    productimage: {
      type: [String],
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "out of stock", "Discountinued"],
      required: true,
      default: "Available",
    },

    // brandId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Brand",
    //   required: true,
    // },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
