const User = require('../models/userSchema');

const userAuth=(req,res,next)=>{
    if(req.session.user){
        User.findById(req.sessio.user)
        .then(data=>{
            if(data&&!data.isBlocked){
                next();
            }else{
                req.flash("error", "Unauthorized access. Please log in.");
                res.redirect("/user/login"); 
            }
        }).catch(error=>{
            console.log("error in user auth middleware");
            res.status(500).send("INternal server error");
        })
    }else{
        res.redirect("/user/login")
    }
}

const redirectAuth=(req,res,next)=>{
    if(req.session&&req.session.user){
        return res.redirect('/user/home')     
}
next()
}

module.exports={
    userAuth,redirectAuth,
}