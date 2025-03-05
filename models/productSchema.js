const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema({
  productId: {
    type: String,
    required: true,
    unique: true, // Ensures each product has a unique ID
  },
  name: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  material: {
    type: String,
    required: true,
  },
  warranty: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  productImage: {
    type: [String],
    required: false,
  },
  brandId: {
    type: Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: "Category", 
    required: true,
  },
  stockStatus: {
    type: String,
    enum: ["in_stock", "out_of_stock", "low_stock"],
    required: true,
  },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
