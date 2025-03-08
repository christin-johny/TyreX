const express = require('express')
const router=express.Router()
const userController=require('../controllers/user/userController.js');
const profileController=require('../controllers/user/profileController.js')
const productController=require('../controllers/user/productController.js')
const passport = require('passport')

router.get('/pageNotFound',userController.pageNotFound)

router.get('/home',userController.loadHome)

//Sign Up management
router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.post('/verifyOtp',userController.verifyOtp);
router.post("/resendOtp",userController.resendOtp);
router.get('/auth/google',passport.authenticate("google",{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{res.redirect('/user/home')});

//Login Management
router.get('/login',userController.loadLogin);
router.post("/login",userController.login);

//profile Management
router.get("/forgotPassword",profileController.loadForgotPassPage);
router.post("/forgotEmailValid",profileController.forgotEmailValid);
router.post("/verifyPassForgotOTP",profileController.verifyPassForgotOTP)
router.get("/resetPassword",profileController.loadResetPassPage);
router.post('/resendForgotOtp',profileController.resendOtp);
router.post('/resetPassword',profileController.resetPassword)

//product management
router.get('/productList',productController.loadProductList)







module.exports = router;