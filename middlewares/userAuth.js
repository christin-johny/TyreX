const User = require('../models/userSchema');

const userAuth=(req,res,next)=>{
    if(req.session.user){
        User.findById(req.sessio.user)
        .then(data=>{
            if(data&&!data.isBlocked){
                next();
            }else{
                req.flash("error", "Unauthorized access. Please log in.");
                res.redirect("/login"); 
            }
        }).catch(error=>{
            console.log("error in user auth middleware");
            res.status(500).send("INternal server error");
        })
    }else{
        res.redirect("/login")
    }
}



const redirectAuth=(req,res,next)=>{
    if(req.session&&req.session.user){
        return res.redirect('/home')     
}
next()
}


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




module.exports={
    userAuth,redirectAuth,checkBlockedUser}