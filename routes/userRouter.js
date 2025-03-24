const express = require('express')
const router=express.Router()
const userController=require('../controllers/user/userController.js');
const profileController=require('../controllers/user/profileController.js')
const cartController=require('../controllers/user/cartController.js')
const wishlistController=require('../controllers/user/wishlistController.js')
const {userAuth,redirectAuth,checkBlockedUser}=require('../middlewares/userAuth.js')
const passport = require('passport')

router.get('/pageNotFound',userController.pageNotFound)

router.get('/',userController.loadHome)
//Sign Up management
router.get('/login',userController.loadLogin);
router.post("/login",userController.login);
router.get('/signup',redirectAuth,userController.loadSignup);
router.post('/signup',redirectAuth,userController.signup);
router.post('/verifyOtp',userController.verifyOtp);
router.post("/resendOtp",userController.resendOtp);
router.get('/auth/google',redirectAuth,passport.authenticate("google",{scope:['profile','email']}));
router.get("/auth/google/callback",redirectAuth,passport.authenticate("google", { failureRedirect: "/signup", session: false }), profileController.googleSession);
  
router.get('/logout',userController.logout)
//forgot password
router.get("/forgotPassword",redirectAuth,profileController.loadForgotPassPage);
router.post("/forgotEmailValid",profileController.forgotEmailValid);
router.post("/verifyPassForgotOTP",profileController.verifyPassForgotOTP)
router.get("/resetPassword",redirectAuth,profileController.loadResetPassPage);
router.post('/resendForgotOtp',profileController.resendOtp);
router.post('/resetPassword',profileController.resetPassword)

//home page&shopping page
router.get('/home',checkBlockedUser,userController.loadHome);
router.get('/shop',userAuth,userController.shop)
router.get('/filter',userAuth,userController.filter)
router.get('/filterPrice',userAuth,userController.filterByPrice)
router.post('/search',userAuth,userController.search)
router.get('/clear',userAuth,userController.clear);
router.get('/sort',userAuth,userController.sort)

//Product Management
router.get('/details',userAuth,userController.deatails)

//wishlist Management

router.get('/wishlist',wishlistController.loadWishlist);
router.post('/wishlist',wishlistController.addToWishlist);
router.delete('/wishlist',wishlistController.removeFromWishlist);


//cart
router.post("/cart/:productId",userAuth,cartController.addToCart);
router.get('/cart',userAuth,cartController.loadCart);
router.put('/cart',cartController.changeQuantity)
router.delete('/cart',cartController.removeFromCart)





module.exports = router;