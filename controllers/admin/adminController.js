const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const bcrypt = require("bcryptjs");


const pageError=async(req,res)=>{
  res.render('pageError')
}



const loadHomepage = async (req, res) => {
  try {
    return res.render("home");
  } catch (error) {
    console.log("Home page not found");
    res.redirect("/admin/pagerror")
  }
};

//login
const loadLogin = async (req, res) => {
  try {
    return res.render("adminLogin");
  } catch (error) {
    console.log("Login page not found");
    res.redirect("/admin/pagerror")
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      console.log("email and password are required");
      req.flash("error", "email and password are required");
      return res.redirect("/admin/login");
    }
    const user = await User.findOne({ email: email, isAdmin: true });
    if (!user) {
      console.log("Invalid email or password1");
      req.flash("error", "Invalid email or password.");
      return res.redirect("/admin/login");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      console.log("Invalid email or password2");
      req.flash("error", "Invalid email or password.");
      return res.redirect("/admin/login");
    }

    req.session.admin = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.log("error during login");
    req.flash("error", "An error occurred. Please try again.");
    return res.redirect("/admin/login");
  }
};



const logout = async (req, res) => {
  try {
    if (!req.session) {
      return res.redirect("/admin/login");
    }

    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session", err);
        return res.redirect("/admin/pageerror");
      }
      
      return res.redirect("/admin/login");
    });
  } catch (error) {
    console.log("Error during logout:", error);
    res.redirect("/admin/pageerror");
  }
};





const forgotPassword = async (req, res) => {
  try {
    return res.render("forgotPassword");
  } catch (error) {
    console.log("Page not found");
    res.redirect("/admin/pagerror")
  }
};

const loadAddProduct = async (req, res) => {
  try {
    return res.render("addProduct");
  } catch (error) {
    console.log("Page not found");
    res.redirect("/admin/pagerror")
  }
};



module.exports = {
  loadHomepage,
  loadLogin,
  login,
  forgotPassword,
  loadAddProduct,

  pageError,
  logout,

};
