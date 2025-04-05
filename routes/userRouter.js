const express = require('express')
const router=express.Router()
const userController=require('../controllers/user/userController.js');
const profileController=require('../controllers/user/profileController.js')
const cartController=require('../controllers/user/cartController.js')
const wishlistController=require('../controllers/user/wishlistController.js')
const checkoutController = require('../controllers/user/checkoutController.js')
const orderController=require('../controllers/user/orderController.js')
const walletController= require('../controllers/user/walletController.js')
const {userAuth,redirectAuth,checkBlockedUser}=require('../middlewares/userAuth.js')
const passport = require('passport');
const multer = require("multer");
const storage=require("../helpers/multer")
const uploads=multer({storage:storage});


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

//profile managemenet
router.get('/profile',userAuth,profileController.loadProfilePage)
router.get('/editProfile',userAuth,profileController.loadEditProfilePage);
router.post('/uploadProfile',userAuth,uploads.single('profileImage'),profileController.uploadProfile);
router.get('/changePassword',userAuth,profileController.loadChangePassPage);
router.post('/changePassword',userAuth,profileController.changePassword);


// router.get('/forgotPassword',profileController.loadForgotPasswordPage);
// router.post('/forgotEmailValid', profileController.forgotEmailValid);
// router.put('/changeEmail',userAuth,profileController.changeEmail);
// router.post('/EmailValid', userAuth, profileController.emailValid);


//Address Management
router.get("/address",userAuth,profileController.loadAddressPage);
router.get('/addAddress',userAuth,profileController.loadAddAddressPage);
router.post('/addAddress',userAuth,profileController.addAddressPage);
router.get('/editAddress', userAuth, profileController.loadEditAddress);
router.put('/editAddress',userAuth,profileController.editAddress);
router.delete('/deleteAddress',userAuth,profileController.deleteAddress);


//Product Management
router.get('/details',userAuth,userController.details)

//wishlist Management

router.get('/wishlist',userAuth,wishlistController.loadWishlist);
router.post('/wishlist',userAuth,wishlistController.addToWishlist);
router.delete('/wishlist',userAuth,wishlistController.removeFromWishlist);


//cart
router.post("/cart/:productId",userAuth,cartController.addToCart);
router.get('/cart',userAuth,cartController.loadCart);
router.put('/cart',userAuth,cartController.changeQuantity)
router.delete('/cart',userAuth,cartController.removeFromCart)

//checkout
router.get('/checkout',userAuth,checkoutController.loadCheckoutPage)
router.get('/checkoutAddress',userAuth,checkoutController.addAddressCheckout)
router.post('/checkoutAddress',userAuth,checkoutController.saveAddressCheckout)
router.post('/applyCoupon',userAuth,checkoutController.applyCoupon);
router.delete('/removeCoupon',userAuth,checkoutController.removeCoupon)

//order 
router.post('/placeOrder',userAuth,orderController.placeOrder)
router.post('/placeWalletOrder',userAuth,orderController.placeWalletOrder)
router.get('/orders',userAuth,orderController.orders);
router.get('/orderDetails',userAuth,orderController.orderDetails)
router.put('/cancelOrder',userAuth,orderController.cancelOrder)
router.get('/downloadInvoice',userAuth,orderController.downloadInvoice);
router.post("/return", userAuth,uploads.array('images', 3), orderController.requestReturn);
router.post('/orderSearch',userAuth,orderController.orderSearch)
router.put('/cancelReturnRequest',userAuth,orderController.cancelReturnRequest);
router.get('/confirmation',userAuth,orderController.loadConfirmation),




//wallet
router.get('/wallet',userAuth,walletController.loadWallet)
router.post("/wallet/createOrder",userAuth, walletController.createOrder);
router.post("/wallet/verifyPayment",userAuth, walletController.verifyPayment);
router.put("/wallet/withdrawMoney",userAuth,walletController.withdrawMoney);

//rozorpay online payment
router.post("/order/createOrder",userAuth,orderController.createOrder)
router.post("/order/verifyPayment",userAuth,orderController.verifyPayment);



module.exports = router;