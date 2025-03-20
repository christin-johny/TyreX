const User = require('../models/userSchema');

const userAuth = async (req, res, next) => {
    try {
        if (!req.session?.user) {
            return res.redirect("/home"); 
        }

        const user = await User.findById(req.session.user._id);

        if (!user) {
            req.session.user = null; 
            req.flash("error", "User not found. Please log in again.");
            return res.redirect("/home");
        }

        if (user.isBlocked===true) {
            req.session.user = null;
            req.session.passport = null; 
            req.flash("error", "Your account has been blocked.");
            return res.redirect("/login");
        }

        next(); 
    } catch (error) {
        console.error("Error in userAuth middleware:", error);
        res.status(500).send("Internal Server Error");
    }
};


const checkBlockedUser = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return next();
        }

        const user = await User.findById(req.session.user._id);
        if (!user) {
            req.session.user = null;
            req.session.passport = null; 
            return res.redirect("/home");
        }

        if (user.isBlocked === true) {
            req.session.user = null; 
            req.session.passport = null; 
            return res.redirect(req.originalUrl); 
        }

        next();
    } catch (error) {
        console.error("Error in checkBlockedUser middleware:", error);
        res.status(500).send("Internal Server Error");
    }
};



const redirectAuth=(req,res,next)=>{
    if(req.session&&req.session.user){
        return res.redirect('/home')     
}
next()
}



module.exports={
    userAuth,redirectAuth,checkBlockedUser}