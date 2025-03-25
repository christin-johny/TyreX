const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const session = require("express-session");
const mongoose = require("mongoose");

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

const loadProfilePage = async (req, res) => {
  try {
    const userid = req.session.user._id;
    if (mongoose.isValidObjectId(userid)) {
      const userData = await User.findOne({ _id: userid });
      const addressData = await Address.findOne({ userId: userid });
      res.render("profile", {
        user: userData,
        userAddress: addressData,
      });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const changeEmail = async (req, res) => {
  try {
    const userData = req.session.user;
    res.render("changeEmail", { user: userData });
  } catch (error) {
    console.error(error);
    res.redirect("pageNotFound");
  }
};

const changeEmailValid = async (req, res) => {
  try {
    const { email } = req.body;
    const currrentEmail = req.session.user.email;
    const user = await User.findOne({ email: email });

    if (email == currrentEmail) {
      const otp = generateOtp();
      const emailSent = await sendVerificationEmail(email, otp);
      if (emailSent) {
        req.session.userOtp = otp;
        req.session.userData = req.body;
        req.session.email = email;
        res.render("emailOtp", { user: user });
        console.log("otp sent:", otp);
      } else {
        res.json({ success: false, message: "email-error" });
      }
    } else {
      res.json({
        success: false,
        message: "Enter your registered email address.",
      });
    }
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const emailResendOtp = async (req, res) => {
  try {
    const otp = generateOtp();
    const email = req.session.user.email;
    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      req.session.userOtp = otp;
      req.session.userData = req.body;
      req.session.email = email;
      res.render("emailOtp", { user: user });
      console.log("otp sent:", otp);
    } else {
      res.json({ success: false, message: "email-error" });
    }
  } catch (error) {}
};

const verifyEmailOtp = async (req, res) => {
  try {
    const enteredOtp = req.body.otp;
    if (enteredOtp === req.session.userOtp) {
      res.rendere("newEmail");
    }
  } catch (error) {}
};

const loadAddressPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (mongoose.isValidObjectId(userId)) {
      const userData = await User.findOne({ _id: userId });
      const addressData = await Address.findOne({ userId: userId });
      res.render("address", {
        user: userData,
        userAddress: addressData,
      });
    }
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const loadAddAddressPage = async (req, res) => {
  try {
    const user = req.session.user;

    res.render("addAddress", { user: user });
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const addAddressPage = async (req, res) => {
  try {
    const userId = req.session.user._id;

    if (mongoose.isValidObjectId(userId)) {
      const userData = await User.findOne({ _id: userId });
      const {
        addressType,
        name,
        apartment,
        building,
        street,
        city,
        landmark,
        state,
        country,
        zip,
        phone,
        altPhone,
      } = req.body;
      console.log(req.body);
      const userAddress = await Address.findOne({ userId: userData._id });
      if (!userAddress) {
        const newAddress = new Address({
          userId: userData._id,
          address: [
            {
              addressType,
              name,
              apartment,
              building,
              street,
              city,
              landmark,
              state,
              country,
              zip,
              phone,
              altPhone,
            },
          ],
        });
        await newAddress.save();
        console.log("Address Saved!");
      } else {
        userAddress.address.push({
          addressType,
          name,
          apartment,
          building,
          street,
          city,
          landmark,
          state,
          country,
          zip,
          phone,
          altPhone,
        });
        await userAddress.save();
        console.log("Appended Address saved!");
      }

      res.redirect("/address");
    }
  } catch (error) {
    console.log("Error Adding address :", error);
    res.redirect("/pageNotFound");
  }
};

const loadEditAddress = async (req, res) => {
  try {
    const addressId = req.query.id;

    const user = req.session.user;

    if (mongoose.isValidObjectId(addressId)) {
      const currentAddress = await Address.findOne({
        "address._id": addressId,
      });

      if (!currentAddress) {
        return res.status(404).send("Address not found");
      }

      const addressData = currentAddress.address.find(
        (addr) => addr._id == addressId
      );

      if (!addressData) {
        return res.status(404).send("Address not found");
      }
      console.log(addressData)
      res.render("editAddress", { user, address: addressData });
    }
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).send("Internal Server Error");
  }
};


const editAddress = async (req, res) => {
  try {
    const addressId = req.query.id;
    const user = req.session.user;
    const updatedData = req.body;

    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    if (!mongoose.isValidObjectId(addressId)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    if (!updatedData || Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    // Find the user address document
    const addressDocument = await Address.findOne({ "address._id": addressId });

    if (!addressDocument) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Update the specific address inside the array
    const updatedAddress = await Address.updateOne(
      { "address._id": addressId },
      {
        $set: {
          "address.$.addressType": updatedData.addressType,
          "address.$.name": updatedData.name,
          "address.$.apartment": updatedData.apartment,
          "address.$.building": updatedData.building,
          "address.$.street": updatedData.street,
          "address.$.city": updatedData.city,
          "address.$.landmark": updatedData.landmark,
          "address.$.state": updatedData.state,
          "address.$.country": updatedData.country,
          "address.$.zip": updatedData.zip,
          "address.$.phone": updatedData.phone,
          "address.$.altPhone": updatedData.altPhone,
        },
      }
    );

    if (updatedAddress.modifiedCount === 0) {
      return res.status(400).json({ message: "No changes were made" });
    }

    console.log("Address updated successfully");
    res.status(200).json({ message: "Address updated successfully!" });
  } catch (error) {
    console.error(" Error editing address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



const deleteAddress = async(req,res,next)=>{
  try {
      
      const addressId = req.query.id;
      
      if (!addressId) {
          return res.status(400).json({ message: "Address ID is required" });
      }
      const updatedDocument = await Address.findOneAndUpdate(
          {"address._id":addressId},
          {$pull:{address:{_id:addressId}}},
          {new:true},
      )
      
      if (!updatedDocument) {
          return res.status(404).json({ message: "Address not found" });
      }

      console.log("Address deleted successfully");
      res.status(200).json({ message: "Address deleted successfully!" });


  } catch (error) {
      console.error(" Error deleting address:", error);
      next(error);
  }
}


const uploadProfile = async (req, res, next) => {
  try {
      if (!req.file) {
          return res.status(400).send("No file uploaded.");
      }

      const updatedUser = await User.findByIdAndUpdate(
          req.session.user._id,
          { profileImage:req.file.filename },
          { new: true }
      );
      if (!updatedUser) {
          return next(new Error("User not found."));
      }
      res.redirect('profile');

  } catch (error) {
      next(error);
  }
}

const loadEditProfilePage = async (req, res, next) => {
  try {
      const userid = req.session.user._id;
      if (mongoose.isValidObjectId(userid)) {
          const userData = await User.findOne({ _id: userid });
          const addressData = await Address.findOne({ userId: userid });
          res.render("editProfile", {
              user: userData,
              userAddress: addressData,
          });
      }
  } catch (error) {
      next(error);
  }
}

const loadChangePassPage = async (req, res) => {
  try {
    res.render("changePassword");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const changePassword= async (req, res) => {
  try {
    const { password, cPassword } = req.body;
    console.log(password,cPassword)
    const userId = req.session.user._id;
    console.log(req.session.user)
    if (password === cPassword) {
      const passwordHash = await bcrypt.hash(password, 10);
      await User.updateOne(
        { _id: userId },
        { $set: { password: passwordHash } }
      );
      res.redirect("/profile");
    } else {
      req.flash("error", "Password does not match");
      return res.redirect("/changePassword");
    }
  } catch (error) {
    res.redirect("/pageNotFound");
  }

}

module.exports = {
  loadForgotPassPage,
  forgotEmailValid,
  verifyPassForgotOTP,
  loadResetPassPage,
  resendOtp,
  resetPassword,
  googleSession,
  loadProfilePage,
  changeEmail,
  changeEmailValid,
  emailResendOtp,
  verifyEmailOtp,
  addAddressPage,
  loadAddAddressPage,
  loadAddressPage,
  loadEditAddress,
  editAddress,
  deleteAddress,
  loadEditProfilePage,
  uploadProfile,
  loadChangePassPage,
  changePassword,
};
