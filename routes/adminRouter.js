const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const {adminAuth,redirectAuth,} = require("../middlewares/adminAuthMiddleware");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController");
const brandController=require("../controllers/admin/brandController");
const productController=require("../controllers/admin/productController")
const multer = require("multer");
const storage=require("../helpers/multer")
const uploads=multer({storage:storage});


router.get("/pageerror", adminController.pageError);

router.get("/login", redirectAuth, adminController.loadLogin);

router.post("/login", redirectAuth, adminController.login);

router.get("/logout", adminController.logout);

router.get("/forgotPassword", adminController.forgotPassword);

router.get("/dashboard", adminAuth, adminController.loadHomepage);



// router.get("/addProduct", adminController.loadAddProduct);
// router.post("/addProduct", adminController.addProducts);
// router.post("/addCategoryOffer", categoryController.addCategoryOffer);


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


//product management

router.get("/addProduct",productController.loadAddProductPage)
router.post("/addproduct",uploads.array("images",4),productController.addproduct)
router.get('/products',productController.loadAllproducts);
router.post('/addProductOffer',productController.addProductOffer);
router.post('/removeProductOffer',productController.removeProductOffer);
router.get('/blockProduct',productController.blockProduct);
router.get('/unblockProduct',productController.unblockProduct);



module.exports = router;
