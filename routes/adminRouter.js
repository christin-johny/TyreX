const express = require('express')
const router=express.Router()
const adminController=require('../controllers/admin/adminController')
const {adminAuth,redirectAuth} = require("../middlewares/adminAuthMiddleware");
const customerController=require('../controllers/admin/customerController')
const categoryController=require('../controllers/admin/categoryController')



router.get('/pageerror',adminController.pageError)

router.get('/login',redirectAuth,adminController.loadLogin);

router.post('/login',redirectAuth,adminController.login)

router.get('/logout',adminController.logout)

router.get('/forgotPassword',adminController.forgotPassword)

router.get('/dashboard',adminAuth,adminController.loadHomepage);

router.get('/products',adminController.products)

router.get('/addProduct',adminController.loadAddProduct)
router.post('/addProduct',adminController.addProducts)
router.post('/addCategoryOffer',categoryController.addCategoryOffer);




//Coustomer Management
router.get('/users',adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked)
router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked)


//category Management
router.get('/category',categoryController.categoryInfo);
router.post('/addCategory',categoryController.addCategory)





module.exports = router;