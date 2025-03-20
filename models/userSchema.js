const mongoose = require("mongoose");
const category = require("./categorySchema");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true,
    unique: true,
  },
  phone:{
    type:String,
    required:false,
    unique:false,
    sparse:true,
  },
  googleId:{
    type:String,
    sparse:true,
    unique:true,
  },
  password:{
    type:String,
    required:false,
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  isAdmin:{
    type:Boolean,
    default:false,
  },

  //relations

  addresses:[
    {
        type:Schema.Types.ObjectId,
        ref:"Adress",
    },
  ],
  orders:[
    {
        type:Schema.Types.ObjectId,
        ref:"Order",
    }
  ],
  payments:[
    {
        type:Schema.Types.ObjectId,
        ref:"Payment",
    }
  ],
  wishlists:[
    {
        type:Schema.Types.ObjectId,
        ref:"wishlists",
    }
  ],
  carts:[
    {
        type:Schema.Types.ObjectId,
        ref:"Cart",
    }
  ],
  wallet:[
    {
        type:Schema.Types.ObjectId,
        ref:"Wallet",
    }],
    orderHistory:[{
      type:Schema.Types.ObjectId,
      ref:"Order"
    }],
  coupons:[
    {
        type:Schema.Types.ObjectId,
        ref:"Coupon",
    }
  ],
  reviews:[
    {
        type:Schema.Types.ObjectId,
        ref:"Review",
    }
  ],
  referalCode:{
    type:String
  },
  redeemedUsers:[{
    type:Schema.Types.ObjectId,
    ref:'User'
  }],
  searchHistory:[{
    category:{
      type:Schema.Types.ObjectId,
      ref:'Category'
    },
    brand:{
      type:Schema.Types.ObjectId,
      ref:'Brand'
    },
    searchOn:{
      type:Date,
      default:Date.now
    }
  }]


},{ timestamps: true });




const User = mongoose.model("User",userSchema);
module.exports = User;