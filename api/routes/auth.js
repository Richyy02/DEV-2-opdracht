const express = require('express');
const { message } = require('statuses');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')



const router = express.Router();
const db = require("../database/database");

router.post('/', async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const loginCheck = (username, callback) => {
        return db.get('select customer_id, email, firstname, infix, lastname, street, housenumber, suffix, zipcode, city, newsletter, password, userrole_id, country_id from customers where email = ?', [username], (err, row) => {
            callback(err, row)
        });
    }
    // checkt op de login en compared ook het wachtwoord met bcrypt om te kijken of de user het goede wachtwoord heeft ingevoerd. Het geeft ook inloggegevens incorrect aan als de wachtwoord of username fout is.
    loginCheck(username, (err, user) => {
        if (err) return res.status(500).send("Server error!");
        if (!user) return res.status(400).json({ message: "Inloggegevens incorrect" });
        const result = bcrypt.compareSync(password, user.password);
        if (!result) return res.status(400).json({ message: "Inloggegevens incorrect" });
        // geeft vervolgens een token mee met alle info van de user
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
        res.status(200)
        res.json({
            access_token: accessToken
        })
    })

})

module.exports = router;


