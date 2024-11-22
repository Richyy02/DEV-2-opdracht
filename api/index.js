require('dotenv').config();
const express = require('express');
const dbPath = process.env.DB_NAME;
console.log('Resolved DB Path:', dbPath);

// ================================================ CREATION ===========
const app = express();

// ================================================ SERVE FRONTEND =====
app.use(express.static('../public'));

// ================================================ MIDDLEWARE =========
app.use(express.json()); // adds the json body to the request object

// ================================================ ROUTES =============
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'))
app.use('/api/countries', require('./routes/countries'))
app.use('/api/auth', require('./routes/auth'))
app.use('/api/orders', require('./routes/orders'))

// ================================================ START ==============
const server = app.listen(process.env.PORT || 8080, () => {
    let name = process.env.APP_NAME || 'app';
    let port = server.address().port;
    console.log(`${name} listening on port ${port}`);
});