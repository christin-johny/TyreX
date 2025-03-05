const session = require("express-session");


const sessionMiddleware = session({
    secret:process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true
});

const flashMiddleware=(req, res, next) => {
    res.locals.success_msg = req.flash("success");
    res.locals.error_msg = req.flash("error");
    next();
}

module.exports = {sessionMiddleware,flashMiddleware}