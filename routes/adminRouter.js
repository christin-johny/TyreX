const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const {adminAuth,redirectAuth,} = require("../middlewares/adminAuthMiddleware");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController=require("../controllers/admin/brandController");
const productController=require("../controllers/admin/productController");
const bannerController = require("../controllers/admin/bannerController");
const orderController = require("../controllers/admin/orderController");
const couponController = require('../controllers/admin/couponController');
const salesController = require('../controllers/admin/salesController')
const multer = require("multer");
const storage=require("../helpers/multer")
const uploads=multer({storage:storage});


router.get("/pageerror", adminController.pageError);


//profile
router.get("/login", redirectAuth, adminController.loadLogin);
router.post("/login", redirectAuth, adminController.login);
router.get("/logout", adminController.logout);
// router.get("/forgotPassword", adminController.forgotPassword);
router.get("/dashboard", adminAuth, adminController.loadHomepage);



//Coustomer Management
router.get("/users", adminAuth, customerController.customerInfo);
router.get("/blockCustomer", adminAuth, customerController.customerBlocked);
router.get("/unblockCustomer", adminAuth, customerController.customerUnblocked);


//category Management
router.get("/category",adminAuth, categoryController.categoryInfo);
router.post("/addCategory", adminAuth,categoryController.addCategory);
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer)
router.delete("/removeCategoryOffer", adminAuth,categoryController.removeCategoryOffer);
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory);
router.get("/editCategory", adminAuth,categoryController.loadEditCategory);
router.post("/editCategory/:id", adminAuth,categoryController.editCategory);

//brand Management
router.get("/brands",adminAuth,brandController.loadBrandPage);
router.post('/addBrand',adminAuth,uploads.single("image"),brandController.addBrand)
router.get("/blockBrand",adminAuth,brandController.blockBrand);
router.get("/unblockBrand",adminAuth,brandController.unblockBrand);
router.get("/deleteBrand",adminAuth,brandController.deleteBrand);
router.get('/editbrand',adminAuth,brandController.loadEditBrand)
router.put("/editBrand/:id",adminAuth, uploads.single("image"),brandController.editBrand)


//product management

router.get("/addProduct",adminAuth,productController.loadAddProductPage)
router.post("/addproduct",adminAuth,uploads.array("images",4),productController.addproduct)
router.get('/products',adminAuth,productController.loadAllproducts);
router.post('/addProductOffer',adminAuth,productController.addProductOffer);
router.post('/removeProductOffer',adminAuth,productController.removeProductOffer);
router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unblockProduct',adminAuth,productController.unblockProduct);
router.get('/editProduct',adminAuth,productController.loadEditProduct);
router.post('/editProduct/:id',adminAuth,uploads.array("images",4),productController.editProduct);
router.delete('/deleteImage',adminAuth,productController.deleteSingleImage);

//banner maagement
router.get('/banner',adminAuth,bannerController.loadBannerPage)
router.get('/addBanner',adminAuth,bannerController.loadAddBannerPage);
router.post('/banner',adminAuth,uploads.single("images"),bannerController.addBanner)
router.delete('/banner',adminAuth,bannerController.deleteBanner);


//order management
router.get('/orders',adminAuth,orderController.loadOrders);
router.get('/adminOrders/:id',adminAuth,orderController.viewOrderDetails);
router.put('/updateStatus',adminAuth,orderController.updateStatus);
router.put('/orderCancel',adminAuth,orderController.orderCancel);
router.put('/handleReturn',adminAuth,orderController.handleReturn)
router.put('/updateReturnStatus',adminAuth,orderController.updateReturnStatus)

// Inventory management
router.get('/inventory',adminAuth,productController.loadInventory);
router.patch('/inventory',adminAuth,productController.updateInventory)

//Coupon Management
router.get('/coupon',adminAuth,couponController.loadCoupon);
router.post ('/coupon',adminAuth,couponController.addCoupon);
router.put('/coupon',adminAuth,couponController.editCoupon);
router.delete('/coupon',adminAuth,couponController.deleteCoupon);

//sales management

router.get('/sales',salesController.loadSales);
router.get('/salesReport',salesController.loadSalesReport);




module.exports = router;
