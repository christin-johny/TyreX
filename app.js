const express = require('express');
const app = express();
const path = require('path');
const nocache = require('nocache');
const flash = require("connect-flash");
const env = require('dotenv').config();
const db = require('./config/db');
const adminRouter = require("./routes/adminRouter");
const middleware = require("./middlewares/middleware");
const mongoose = require("mongoose");
const User = require("./models/userSchema");

db();

app.use(nocache()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]);

app.use(express.static('public'));

app.use(middleware.sessionMiddleware);

app.use(flash());
app.use(middleware.flashMiddleware);

app.use('/admin', adminRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('> Server is up and running on port : ' + port));
