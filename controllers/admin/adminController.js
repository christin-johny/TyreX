const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const bcrypt = require("bcryptjs");
const Brand = require("../../models/brandSchema");

const Order = require("../../models/orderSchema");
const Category = require("../../models/categorySchema");

const mongoose = require("mongoose");

const pageError=async(req,res)=>{
  res.render('pageError')
}



const getTopBrands = async (matchStage) => {
  const brandStats = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$orderedItems" },
    { $match: { "orderedItems.product.brandId": { $exists: true, $ne: null } } },
    {
      $group: {
        _id: "$orderedItems.product.brandId",
        totalQuantity: { $sum: "$orderedItems.quantity" },
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        brandId: "$_id",
        brandName: { $ifNull: ["$brand.brandName", "Unknown Brand"] },
        totalQuantity: 1,
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 10 },
  ]);

  return brandStats;
};


const loadHomepage = async (req, res, next) => {
  try {
    const filter = req.query.filter || "weekly";

    // Time range filtering
    const matchStage = { status: "delivered" };
    const now = new Date();

    if (filter === "daily") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      matchStage.createdAt = { $gte: startOfDay };
    } else if (filter === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); 
      startOfWeek.setHours(0, 0, 0, 0);
      matchStage.createdAt = { $gte: startOfWeek };
    } else if (filter === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      matchStage.createdAt = { $gte: startOfMonth };
    } else if (filter === "yearly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      matchStage.createdAt = { $gte: startOfYear };
    }

    const topProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.product._id",
          totalSold: { $sum: "$orderedItems.quantity" },
          name: { $first: "$orderedItems.product.productName" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Top Categories
    const topCategories = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$orderedItems" },
      {
        $group: {
          _id: "$orderedItems.product.categoryId",
          totalSold: { $sum: "$orderedItems.quantity" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $project: {
          name: "$category.name",
          totalSold: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // Top Brands
    const topBrands = await getTopBrands(matchStage);

    res.render("home", {
      filter,
      topProducts,
      topCategories,
      topBrands
    });
  } catch (error) {
    next(error);
  }
};



//login
const loadLogin = async (req, res) => {
  try {
    return res.render("adminLogin");
  } catch (error) {
    console.error("Login page not found");
    res.redirect("/admin/pagerror")
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      
      req.flash("error", "email and password are required");
      return res.redirect("/admin/login");
    }
    const user = await User.findOne({ email: email, isAdmin: true });
    if (!user) {
      
      req.flash("error", "Invalid email or password.");
      return res.redirect("/admin/login");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      
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
    console.error(error)
    req.flash("error", "An error occurred. Please try again.");
    return res.redirect("/admin/login");
  }
};

const logout = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }

    req.session.admin = null; 
    return res.redirect("/admin/login");

  } catch (error) {
    console.error(error);
    res.redirect("/admin/pageerror");
  }
};


const loadAddProduct = async (req, res) => {
  try {
    return res.render("addProduct");
  } catch (error) {
    console.error(error)
    res.redirect("/admin/pagerror")
  }
};



module.exports = {
  loadHomepage,
  loadLogin,
  login,
  loadAddProduct,
  pageError,
  logout,

};
