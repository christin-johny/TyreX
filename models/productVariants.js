const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  sizeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Size",
    required: true,
  },
  typeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Type",
    required: true,
  },
  additionalPrice: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ProductVariant", productVariantSchema);
