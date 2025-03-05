const User = require("../../models/userSchema");
const bcrypt = require("bcryptjs");

const loadHomepage = async (req, res) => {
  try {
    return res.render("home");
  } catch (error) {
    console.log("Home page not found");
    res.status(500).send("Server error");
  }
};



//login
const loadLogin = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log("Login page not found");
    res.status(500).send("server error");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  try{

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
    email: user.email
};
console.log('admin logged in'+req.session.admin );

  return res.redirect("/admin/home");
}catch (error){
    console.log("error during login");
    req.flash('error', 'An error occurred. Please try again.');
    return res.redirect("/admin/login");
}
};



const forgotPassword = async (req, res) => {
  try {
    return res.render("forgotPassword");
  } catch (error) {
    console.log("Page not found");
    res.status(500).send("server error");
  }
};



const addProduct = async (req, res) => {
  try {
    return res.render("addProduct");
  } catch (error) {
    console.log("Page not found");
    res.status(500).send("server error");
  }
};



const products = async (req, res) => {
  try {
    return res.render("products");
  } catch (error) {
    console.log("Page not found");
    res.status(500).send("server error");
  }
};



const category = async (req, res) => {
  try {
    return res.render("category");
  } catch (error) {
    console.log("Page not found");
    res.status(500).send("server error");
  }
};

module.exports = {
  loadHomepage,
  loadLogin,
  login,
  forgotPassword,
  addProduct,
  products,
  category,
};
