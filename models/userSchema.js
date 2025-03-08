const mongoose = require("mongoose");
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
  wallet:
    {
        type:Schema.Types.ObjectId,
        ref:"Wallet",
    },
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
  ]

},{ timestamps: true });




const User = mongoose.model("User",userSchema);
module.exports = User;