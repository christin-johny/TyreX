const express = require('express');
const app = express();
const path = require('path');
const env=require('dotenv').config();
const db = require('./config/db');
const port = process.env.PORT || 3000;  // Default to 3000 if PORT is not set

// Set EJS and correct views path

db()
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Fixing the views path
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
   res.render('admin/home_admin');  // Ensure the file exists in views/admin/
});

console.log("Database URI:", process.env.DB_URL);

app.listen(port, () => console.log('> Server is up and running on port : ' + port));
