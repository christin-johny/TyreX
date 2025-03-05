const adminAuth= (req, res, next) => {
    if (req.session && req.session.admin) {  
        next(); 
    } else {
        req.flash("error", "Unauthorized access. Please log in.");
        res.redirect("/admin/login"); 
    }
};

const redirectAuth=(req, res, next) => {
    if (req.session && req.session.admin) {
        return res.redirect("/admin/home"); 
    }
    next(); 
}


module.exports={adminAuth,redirectAuth,}