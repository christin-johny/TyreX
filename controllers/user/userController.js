const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require('bcrypt')


const pageNotFound=async(req,res)=>{
  try {
    return res.render("pageNotFound");
  } catch (error) {
    console.log("Home page not found");
    res.status(500).send("Server error");
  }
}


const loadHome = async (req, res) => {
  try {
    return res.render("homepage");
  } catch (error) {
    console.log("Home page not found");
    res.status(500).send("Server error");
  }
};

//login
const loadLogin = async (req, res) => {
  try {
    if(!req.session.user){
    return res.render("login");
    }else{
      res.redirect('/user/home')
    }
  } catch (error) {
    console.log("Home page not found");
    res.status(500).send("Server error");
  }
};

const login=async(req,res)=>{
  try {
    const {email,password}=req.body;
    if (email.trim()==='' || password.trim()==="") {
      console.log("email and password are required");
      req.flash("error", "email and password are required");
      return res.redirect("/user/login");
    }

    const findUser = await User.findOne({email:email,isAdmin:false});

    if(!findUser){
      console.log("User not found");
      req.flash("error", "User not found");
      return res.redirect("/user/login");
    }
    if(findUser.isBlocked){
      console.log("User is blocked by admin");
      req.flash("error", "User is blocked by admin");
      return res.redirect("/user/login");
    }

    const match=await bcrypt.compare(password,findUser.password);

    if(!match){
      console.log("Invalid username or password");
      req.flash("error", "Invalid username or password");
      return res.redirect("/user/login");
    }
    req.session.user=findUser._id;
    res.redirect("/user/home")
  } catch (error) {
    console.error("login error",error);
    req.flash("error", "Login failed. Please try again");
    return res.redirect("/user/login"); 
  }
}




const loadSignup = async (req, res) => {
  try {
    if(!req.session.user){
      return res.render("signup");
      }else{
        res.redirect('/user/home')
      }
  } catch (error) {
    console.log("Home page not found");
    res.status(500).send("Server error");
  }
};

//function to generate otp
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "TyreX Verification code",
      text: `Your OTP for TyreX account verification is ${otp}`,
      html: `<b>Your OTP for TyreX account verification is: ${otp}</b>`,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error ssending Email",error)
    return false;
  }
}

const signup = async (req, res) => {
  try {
    const {name,phone,email, password, cpassword } = req.body;
    const findUser = await User.findOne({ email });
    if (findUser) {
      req.flash("error", "User with this email already exists");
      return res.redirect("/user/signup");
    }
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if(!emailSent){
      return res.json("email-error");
    }
    req.session.userOtp=otp;
    req.session.userData={name,phone,email,password};
    res.render("verifyOtp");
    console.log("OTP Sent",otp);

  } catch (error) {
    console.error("signup error",error)
    req.flash("error", "something went wrong try again");
      return res.redirect("/user/signup")
  }
};




const verifyOtp=async(req,res)=>{
  try {
    const {otp}=req.body;
    if(otp===req.session.userOtp){
      const user=req.session.userData;
      const passwordHash = await bcrypt.hash(user.password,10);

      const saveUserData= new User({
        name:user.name,
        email:user.email,
        phone:user.phone,
        password:passwordHash,
        googleId: user.googleId || undefined,

      })
      await saveUserData.save();
      req.session.user = saveUserData._id;
      res.json({success:true,redirectUrl:"/user/home"})
    }else{
      res.status(400).json({success:false,message:"Invalid OTP, pleaase try again"})
    }
  } catch (error) {
    console.error("Error verifying OTP",error)
    res.send(500).json({success:false,messege:"an error occured"})
    
  }
}

const resendOtp=async(req,res)=>{
  try {
    const {email} = req.session.userData;
    if(!email){
      return res.status(400).json({success:false,message:"Email not found in session"})
    }
    const otp= generateOtp();
    req.session.userOtp=otp;

    const emailSent=await sendVerificationEmail(email,otp);
    if(emailSent){
      console.log("Resend OTP:",otp)
      res.status(200).json({success:true,message:"OTP resend Successfully"})
    }
    else{
      res.status(500).json({success:false,message:"Failed to resend OTP, please try again"})
    }


  } catch (error) {
    console.error("Error Resending OTP",otp)
    res.status(500).json({success:false,message:"Internal server error,Please try again"})
  }
}



module.exports = { loadHome, loadLogin, login, loadSignup, signup,verifyOtp,resendOtp,pageNotFound,

}
