const express = require('express');
const session = require("express-session");
const app = express();
const path = require('path');
const nocache = require('nocache');
const flash = require("connect-flash");
const env = require('dotenv').config();
const db = require('./config/db');
const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");
const middleware = require("./middlewares/middleware");
const passport=require('./config/passport');

db();

app.use(nocache()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);

app.use(express.static('public'));




app.use(session({
    secret:process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:24*60*60*1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use(middleware.flashMiddleware);


app.use('/admin', adminRouter);
app.use('/', userRouter);


//error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); 

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log('> Server is up and running on port : ' + port));
