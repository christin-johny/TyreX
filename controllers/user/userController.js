const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Size = require("../../models/size");
const Brand = require("../../models/brandSchema");
const Banner = require("../../models/bannerSchema");
const Wallet = require("../../models/walletSchema");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");

const pageNotFound = async (req, res) => {
  try {
    return res.render("pageNotFound");
  } catch (error) {
    res.status(500).send("Server error");
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.user;

    let productData = await Product.find({
      isBlocked: false,
      quantity: { $gt: 0 },
    })
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "brandId", select: "brandName" })
      .populate({ path: "sizeId", select: "name" })
      .lean();

    const brand = await Brand.find({ isBlocked: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const banners = await Banner.find({
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    productData = productData.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    productData = productData.splice(0, 4);

    if (user) {
      const userData = await User.findOne({ _id: user });
      return res.render("homepage", {
        user: userData,
        products: productData,
        brand: brand,
        banner: banners,
      });
    } else {
      return res.render("homepage", {
        user: null,
        products: productData,
        brand: brand,
        banner: banners,
      });
    }
  } catch (error) {
    console.error("Home page not found", error);
    res.status(500).send("Server error");
  }
};

//login
const loadLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("login");
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.trim() === "" || password.trim() === "") {
      req.flash("error", "email and password are required");
      return res.redirect("/login");
    }

    const findUser = await User.findOne({ email: email, isAdmin: false });

    if (!findUser) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    if (findUser.isBlocked) {
      req.flash("error", "Can't login with this email");
      return res.redirect("/login");
    }

    const match = await bcrypt.compare(password, findUser.password);

    if (!match) {
      req.flash("error", "Invalid username or password");
      return res.redirect("/login");
    }
    req.session.user = findUser;
    res.redirect("/home");
  } catch (error) {
    console.error("login error", error);
    req.flash("error", "Login failed. Please try again");
    return res.redirect("/login");
  }
};

const logout = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/home");
    }

    req.session.user = null;
    res.redirect("/home");
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const loadSignup = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.render("signup");
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

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
    console.error("Error ssending Email", error);
    return false;
  }
}

const signup = async (req, res) => {
  try {
    const { name, phone, email, password, cpassword, referral } = req.body;
    const findUser = await User.findOne({ email });
    if (findUser) {
      req.flash("error", "User with this email already exists");
      return res.redirect("/signup");
    }
    if (referral && referral.trim()) {
      const referralCode = referral.toUpperCase();
      const referredUser = await User.findOne({ referralCode: referralCode });
      if (!referredUser) {
        req.flash("error", "Not a Valid Refferal Code");
        return res.redirect("/signup");
      }
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email-error");
    }

    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password, referral };
    res.render("verifyOtp");
    console.log("OTP Sent", otp);
  } catch (error) {
    console.error("signup error", error);
    req.flash("error", "something went wrong try again");
    return res.redirect("/signup");
  }
};

function generateReferralCode(input) {
  if (!input || typeof input !== "string") return null;

  const base = input.substring(0, 4).toUpperCase();

  const randomNumber = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");

  return `${base}${randomNumber}`;
}

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await bcrypt.hash(user.password, 10);

      let referral = req.session.userData.referral;
      
      referral = referral.toUpperCase();
      let referredUser;
      if (referral && referral.trim()) {
        referredUser = await User.findOne({ referralCode: referral });

        let wallet = await Wallet.findOne({ userId: referredUser._id });
        if (!wallet) {
          wallet = new Wallet({
            userId: referredUser._id,
            balance: 0,
            transactions: [],
          });
        }

        wallet.balance += 500;

        wallet.transactions.push({
          amount: 500,
          type: "credit",
          description: "Referral Reward",
        });

        await wallet.save();
      }

      const referralCode = generateReferralCode(user.name);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
        googleId: user.googleId || undefined,
        referralCode,
        referredBy: referredUser?.name,
      });

      await saveUserData.save();

      if (referral && referral.trim()) {
        let wallet = await Wallet.findOne({ userId: saveUserData._id });
        if (!wallet) {
          wallet = new Wallet({
            userId: saveUserData._id,
            balance: 0,
            transactions: [],
          });
        }

        wallet.balance += 200;

        wallet.transactions.push({
          amount: 200,
          type: "credit",
          description: "Referral Reward",
        });

        await wallet.save();
      }
      req.session.user = saveUserData;
      res.json({ success: true, redirectUrl: "/home" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid OTP, pleaase try again" });
    }
  } catch (error) {
    console.error("Error verifying OTP", error);
    res.send(500).json({ success: false, messege: "an error occured" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found in session" });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("Resend OTP:", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP resend Successfully" });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to resend OTP, please try again",
      });
    }
  } catch (error) {
    console.error("Error Resending OTP", otp);
    res.status(500).json({
      success: false,
      message: "Internal server error,Please try again",
    });
  }
};

const shop = async (req, res) => {
  try {
    const user = req.session.user;
    if (req.session.filteredProducts) {
      req.session.filteredProducts = null;
    }

    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map((category) => category._id.toString());

    const brands = await Brand.find({ isBlocked: false });
    const brandIds = brands.map((brand) => brand._id.toString());

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      isBlocked: false,
      categoryId: { $in: categoryIds },
      brandId: { $in: brandIds },
      quantity: { $gt: 0 },
    })
      .populate("brandId", "brandName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments({
      isBlocked: false,
      categoryId: { $in: categoryIds },
      brandId: { $in: brandIds },
      quantity: { $gt: 0 },
    });

    const totalPages = Math.ceil(totalProducts / limit);
    const categoriesWithIds = categories.map((category) => ({
      _id: category.id,
      name: category.name,
    }));

    res.render("shop", {
      user: user,
      products: products,
      category: categoriesWithIds,
      brand: brands,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error loading shop page:", error);
    res.redirect("/pageNotFound");
  }
};

const filter = async (req, res) => {
  try {
    const user = req.session.user;
    const category = req.query.category;
    const brand = req.query.brand;

    let findProducts;

    if (
      req.session.filteredProducts &&
      req.session.filteredProducts.length > 0
    ) {
      findProducts = req.session.filteredProducts;
    } else {
      findProducts = await Product.find({
        isBlocked: false,
        quantity: { $gt: 0 },
      })
        .populate("brandId", "brandName")
        .lean();
    }

    if (category) {
      findProducts = findProducts.filter(
        (product) => product.categoryId.toString() === category
      );
    }

    if (brand) {
      findProducts = findProducts.filter(
        (product) => product.brandId._id.toString() === brand
      );
    }

    findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const categories = await Category.find({ isListed: true }).lean();
    const brands = await Brand.find({}).lean();

    const categoriesWithIds = categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
    }));

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(findProducts.length / itemsPerPage);
    const currentProduct = findProducts.slice(startIndex, endIndex);

    req.session.filteredProducts = findProducts;

    let userData = null;
    if (user) {
      userData = await User.findById(user._id);
      if (userData) {
        userData.searchHistory.push({
          category: category || null,
          brand: brand || null,
          searchedOn: new Date(),
        });
        await userData.save();
      }
    }

    res.render("shop", {
      user: userData,
      products: currentProduct,
      category: categoriesWithIds,
      brand: brands,
      totalPages,
      currentPage,
      selectedCategory: category || null,
      selectedBrand: brand || null,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const filterByPrice = async (req, res) => {
  try {
    const user = req.session.user;
    const brands = await Brand.find({}).lean();
    const categories = await Category.find({ isListed: true }).lean();

    let findProducts = await Product.find({
      salePrice: { $gt: req.query.gt, $lt: req.query.lt },
      isBlocked: false,
      quantity: { $gt: 0 },
    })
      .populate("brandId", "brandName")
      .lean();

    findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let itemsPerPage = 8;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(findProducts.length / itemsPerPage);
    const currentProduct = findProducts.slice(startIndex, endIndex);

    req.session.filteredProducts = findProducts;

    res.render("shop", {
      user: user,
      products: currentProduct,
      category: categories,
      brand: brands,
      totalPages,
      currentPage,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const search = async (req, res) => {
  try {
    const user = req.session.user;
    let search = req.body.query;
    const brands = await Brand.find({}).lean();
    const categories = await Category.find({ isListed: true }).lean();
    const categoryIds = categories.map((category) => category._id.toString());

    let searchResult = [];

    if (
      req.session.filteredProducts &&
      req.session.filteredProducts.length > 0
    ) {
      searchResult = req.session.filteredProducts.filter((product) =>
        product.productName.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      const matchingBrands = await Brand.find({
        brandName: { $regex: ".*" + search + ".*", $options: "i" },
      }).lean();

      const matchingCategories = await Category.find({
        name: { $regex: ".*" + search + ".*", $options: "i" },
      }).lean();

      const matchingBrandIds = matchingBrands.map((brand) => brand._id);
      const matchingCategoryIds = matchingCategories.map(
        (category) => category._id
      );

      searchResult = await Product.find({
        $and: [
          { isBlocked: false },
          { quantity: { $gt: 0 } },
          {
            $or: [
              { productName: { $regex: ".*" + search + ".*", $options: "i" } },
              { brandId: { $in: matchingBrandIds } },
              { categoryId: { $in: matchingCategoryIds } },
            ],
          },
        ],
      })
        .populate("brandId", "brandName")
        .populate("categoryId", "name")
        .lean();
    }

    searchResult.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let itemsPerPage = 8;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(searchResult.length / itemsPerPage);
    const currentProduct = searchResult.slice(startIndex, endIndex);

    res.render("shop", {
      user: user,
      products: currentProduct,
      category: categories,
      brand: brands,
      totalPages,
      currentPage,
      count: searchResult.length,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

const clear = async (req, res) => {
  try {
    const user = req.session.user;
    if (req.session.filteredProducts) {
      req.session.filteredProducts = null;
    }
    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map((category) => category._id.toString());

    const brands = await Brand.find({ isBlocked: false });
    const brandIds = brands.map((brand) => brand._id.toString());

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      isBlocked: false,
      categoryId: { $in: categoryIds },
      brandId: { $in: brandIds },
      quantity: { $gt: 0 },
    })
      .populate("brandId", "brandName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments({
      isBlocked: false,
      categoryId: { $in: categoryIds },
      brandId: { $in: brandIds },
      quantity: { $gt: 0 },
    });

    const totalPages = Math.ceil(totalProducts / limit);
    const categoriesWithIds = categories.map((category) => ({
      _id: category.id,
      name: category.name,
    }));

    res.render("shop", {
      user: user,
      products: products,
      category: categoriesWithIds,
      brand: brands,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error loading shop page:", error);
    res.redirect("/pageNotFound");
  }
};

const sort = async (req, res) => {
  try {
    const sort = req.query.sort;

    const user = req.session.user;

    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map((category) => category._id.toString());

    const brands = await Brand.find({ isBlocked: false });
    const brandIds = brands.map((brand) => brand._id.toString());

    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    let products;

    if (
      req.session.filteredProducts &&
      req.session.filteredProducts.length > 0
    ) {
      products = req.session.filteredProducts;
    } else {
      products = await Product.find({
        isBlocked: false,
        categoryId: { $in: categoryIds },
        brandId: { $in: brandIds },
        quantity: { $gt: 0 },
      })
        .populate("brandId", "brandName")
        .skip(skip)
        .limit(limit);
    }

    if (sort === "a-z") {
      products = products.sort((a, b) =>
        a.productName.localeCompare(b.productName, "en", {
          sensitivity: "base",
        })
      );
    } else if (sort === "z-a") {
      products = products.sort((a, b) =>
        b.productName.localeCompare(a.productName, "en", {
          sensitivity: "base",
        })
      );
    } else if (sort === "low-high") {
      products = products.sort((a, b) => a.salePrice - b.salePrice);
    } else if (sort === "high-low") {
      products = products.sort((a, b) => b.salePrice - a.salePrice);
    }
    const totalProducts = await Product.countDocuments({
      isBlocked: false,
      categoryId: { $in: categoryIds },
      brandId: { $in: brandIds },
      quantity: { $gt: 0 },
    });

    const totalPages = Math.ceil(totalProducts / limit);
    const categoriesWithIds = categories.map((category) => ({
      _id: category.id,
      name: category.name,
    }));

    res.render("shop", {
      user: user,
      products: products,
      category: categoriesWithIds,
      brand: brands,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error loading shop page:", error);
    res.redirect("/pageNotFound");
  }
};

const details = async (req, res) => {
  try {
    const userData = req.session.user;
    const productId = req.query.id;
    const product = await Product.findById(productId)
      .populate("categoryId")
      .populate("brandId")
      .populate("sizeId");

    if (!product || product.isBlocked) {
      return res.redirect("/shop");
    }

    const findCategory = product.categoryId;
    const categoryOffer = findCategory?.categoryOffer || 0;
    const productOffer = product.productOffer || 0;
    const totalOffer = categoryOffer + productOffer;

    const catId = product.categoryId._id;

    let productData = await Product.find({
      isBlocked: false,
      quantity: { $gt: 0 },
      categoryId: catId,
      _id: { $ne: productId },
    })
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "brandId", select: "brandName" })
      .populate({ path: "sizeId", select: "name" })
      .lean();

    res.render("productDetails", {
      user: userData,
      product: product,
      products: productData,
      quantity: product.quantity,
      totalOffer: totalOffer,
      category: findCategory,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
};

module.exports = {
  loadHome,
  loadLogin,
  login,
  loadSignup,
  signup,
  verifyOtp,
  resendOtp,
  pageNotFound,
  logout,
  shop,
  filter,
  filterByPrice,
  search,
  clear,
  sort,
  details,
};
