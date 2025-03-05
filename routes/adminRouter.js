const express = require('express')
const router=express.Router()
const adminController=require('../controllers/admin/adminController')
const authMiddleware = require("../middlewares/authMiddleware");


router.get('/login',authMiddleware.redirectAuth,adminController.loadLogin);

router.post('/login',authMiddleware.redirectAuth,adminController.login)

router.get('/forgotPassword',adminController.forgotPassword)

router.get('/home',authMiddleware.adminAuth,adminController.loadHomepage);

router.get('/addProduct',adminController.addProduct)

router.get('/products',adminController.products)

router.get('/category',adminController.category)









module.exports = router;