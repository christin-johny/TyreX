const User = require("../../models/userSchema");

const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const session = require("express-session");

const googleSession = (req, res) => {
  const adminSession = req.session.admin || null;

  req.session.user = req.user;
  if (adminSession) {
    req.session.admin = adminSession;
  }

  req.session.save((err) => {
    if (err) console.error("Session save error:", err);
    res.redirect("/home");
  });
};

function generateOtp() {
  const digits = "1234567890";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

const sendVerificationEmail = async (email, otp) => {
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

    const mailoptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "TyreX Verification code",
      text: "Your OTP for password resetting",
      html: `<b><h4>Your OTP for password resetting is </h4><h2>${otp}</h2></b>`,
    };

    const info = await transporter.sendMail(mailoptions);
    console.log("Emailsend", info.messageId);
    return true;
  } catch (error) {
    console.error("error sending email", error);
    return false;
  }
};

const loadForgotPassPage = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const forgotEmailValid = async (req, res) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email: email });
    if (findUser) {
      const otp = generateOtp();
      const emailSent = await sendVerificationEmail(email, otp);
      if (emailSent) {
        req.session.userOtp = otp;
        req.session.email = email;
        res.render("forgotPasswordOtp");
        console.log("otp:", otp);
      } else {
        response.json({
          success: false,
          message: "falied to send otp, please try again",
        });
      }
    } else {
      req.flash("error", "user with this email does not exists");
      return res.redirect("/forgotPassword");
    }
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const verifyPassForgotOTP = async (req, res) => {
  try {
    const enteredOtp = req.body.otp;

    if (enteredOtp === req.session.userOtp) {
      return res.json({
        success: true,
        message: "OTP Verified Successfully!",
        redirectUrl: "/resetPassword",
      });
    } else {
      return res.json({
        success: false,
        message: "Invalid OTP! Please try again.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred. Please try again.",
    });
  }
};

const loadResetPassPage = async (req, res) => {
  try {
    res.render("resetPassword");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const resendOtp = async (req, res) => {
  try {
    const otp = generateOtp();
    req.session.userOtp = otp;
    const email = req.session.email;
    console.log("Resending otp to email: ", email);
    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("Resent OTP: ", otp);
      res
        .status(200)
        .json({ success: true, message: "Resend OTP successfull" });
    }
  } catch (error) {
    console.error("Error in resending otp", error);
    res.status(500), json({ success: false, message: "internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, cPassword } = req.body;
    const email = req.session.email;
    if (password === cPassword) {
      const passwordHash = await bcrypt.hash(password, 10);
      await User.updateOne(
        { email: email },
        { $set: { password: passwordHash } }
      );
      res.redirect("/login");
    } else {
      req.flash("error", "Password does not match");
      return res.redirect("/resetPassword");
    }
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

module.exports = {
  loadForgotPassPage,
  forgotEmailValid,
  verifyPassForgotOTP,
  loadResetPassPage,
  resendOtp,
  resetPassword,
  googleSession,
};
