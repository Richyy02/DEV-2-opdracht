const express = require('express');
const { message } = require('statuses');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const checkAuth = require("../middleware/checkAuth")

const router = express.Router();
const db = require("../database/database");

router.get('/', checkAuth.authenticateToken, checkAuth.authRole(3), (req, res) => {
    const qry = "select customer_id as id, email, firstname, infix, lastname, street, housenumber, zipcode, city, newsletter, userrole_id, country_id from customers";
    const params = [req.body.firstname];

    db.all(qry, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.meassage });
            return;
        }
        res.json({
            users: rows
        });
    });
});

router.post("/", async (req, res) => {
    try {
        const salt = await bcrypt.genSalt()
        const hashedPassword = await bcrypt.hash(req.body.password, salt)

        let errors = [];

        if (!req.body.firstname) {
            errors.push("Geen voornaam ingevuld!");
        }
        if (!req.body.firstname.match(/^[A-Za-z]{2}/)) {
            errors.push("Voornaam moet tenminste 2 karakters bevatten");
        }
        if (!req.body.lastname) {
            errors.push("Geen achternaam ingevuld!");
        }
        if (!req.body.lastname.match(/^[A-Za-z]{2}/)) {
            errors.push("Achternaam moet tenminste 2 karakters bevatten")
        }
        if (!req.body.street) {
            errors.push("Geen straat ingevuld!");
        }
        if (!req.body.street.match(/^[A-Za-z]{2}/)) {
            errors.push("Straatnaam moet tenminste 2 karakters bevatten")
        }
        if (!req.body.housenumber) {
            errors.push("Geen huisnummer ingevuld!");
        }
        if (!req.body.zipcode) {
            errors.push("Geen postcode ingevuld!");
        }
        if (!req.body.zipcode.match(/^[1-9]\d{3}(?: ?[A-Za-z]{2})?$/)) {
            errors.push("Dit is geen geldige postcode!");
        }
        if (!req.body.city) {
            errors.push("Geen stad ingevuld!");
        }
        if (!req.body.city.match(/^[A-Za-z]{2}/)) {
            errors.push("Stad naam moet tenminste 2 karakters bevatten")
        }
        if (!req.body.country > 0) {
            errors.push("Geen land ingevuld!");
        }
        if (!req.body.email) {
            errors.push("Geen email ingevuld!");
        }
        if (!req.body.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)) {
            errors.push("Dit is geen geldige email adres");
        }
        if (!req.body.password.match(/^(?=.*\d)(?=.*[a-zA-Z]).*$/)) {
            errors.push("Het wachtwoord moet letters en nummers bevatten");
        }
        if (!hashedPassword) {
            errors.push("Geen wachtwoord ingevoerd");
        }
        if (errors.length) {
            res.status(400).json({ errors });
            return;
        }
        let qry = "insert into customers (firstname, infix, lastname, street, housenumber, suffix, zipcode, city, country_id, email, password, newsletter) values (?,?,?,?,?,?,?,?,?,?,?,?)";
        let params = [
            req.body.firstname,
            req.body.infix,
            req.body.lastname,
            req.body.street,
            req.body.housenumber,
            req.body.suffix,
            req.body.zipcode,
            req.body.city,
            req.body.country,
            req.body.email,
            hashedPassword,
            req.body.newsletter
        ];
        db.run(qry, params, function (err) {
            if (err) {
                res.status(400)
                if (err.message.includes("UNIQUE")) {
                    res.json({ errors: "Dit email adres bestaat al" })
                }
                return;
            }
            res.status(200)
            res.json({
                message: "success"
            })
        })
    } catch (e) {
        res.status(500).send()
    }

})

router.patch("/:id", checkAuth.authenticateToken, checkAuth.authRole(2), async (req, res) => {
    try {


        let errors = [];

        if (req.body.zipcode !== undefined) {
            const regExCheck = !!req.body.zipcode.match(/^[1-9]\d{3}(?: ?[A-Za-z]{2})?$/)
            if (!regExCheck) {
                errors.push("Dit is geen geldige postcode!")
            }
        }
        if (req.body.email !== undefined) {
            const regExCheck = !!req.body.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g)
            if (!regExCheck) {
                errors.push("Dit is geen geldige email adres")
            }
        }
        if (req.body.password !== undefined) {
            const salt = await bcrypt.genSalt()
            var hashedPassword = await bcrypt.hash(req.body.password, salt)
            const regExCheck = !!req.body.password.match(/^(?=.*\d)(?=.*[a-zA-Z]).*$/)
            if (!regExCheck) {
                errors.push("Het wachtwoord moet letters en nummers bevatten")
            }
        }
        if (req.body.firstname !== undefined) {
            const regExCheck = !!req.body.firstname.match(/^[A-Za-z]{2}/)
            if (!regExCheck) {
                errors.push("Voornaam moet tenminste 2 karakters bevatten")
            }
        }
        if (req.body.lastname !== undefined) {
            const regExCheck = !!req.body.lastname.match(/^[A-Za-z]{2}/)
            if (!regExCheck) {
                errors.push("Achternaam moet tenminste 2 karakters bevatten")
            }
        }
        if (req.body.street !== undefined) {
            const regExCheck = !!req.body.street.match(/^[A-Za-z]{2}/)
            if (!regExCheck) {
                errors.push("Straatnaam moet tenminste 2 karakters bevatten")
            }
        }
        if (req.body.city !== undefined) {
            const regExCheck = !!req.body.city.match(/^[A-Za-z]{2}/)
            if (!regExCheck) {
                errors.push("Stad naam moet tenminste 2 karakters bevatten")
            }
        }

        if (errors.length) {
            res.status(400).json({ errors });
            return;
        }

        let qry = "UPDATE customers set firstname = coalesce(?,firstname), infix = coalesce(?,infix), lastname = coalesce(?,lastname), street = coalesce(?,street), housenumber = coalesce(?,housenumber), suffix = coalesce(?,suffix), zipcode = coalesce(?,zipcode), city = coalesce(?,city), country_id = coalesce(?,country_id), email = coalesce(?,email), password = coalesce(?,password), newsletter = coalesce(?,newsletter) where customer_id = ?"
        let params = [
            req.body.firstname,
            req.body.infix,
            req.body.lastname,
            req.body.street,
            req.body.housenumber,
            req.body.suffix,
            req.body.zipcode,
            req.body.city,
            req.body.country,
            req.body.email,
            hashedPassword,
            req.body.newsletter,
            req.params.id
        ];
        db.run(qry, params, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(200)
            res.json({
                message: "success"
            })
        })
    } catch (e) {
        res.status(500).send()
    }
})


router.get('/me', checkAuth.authenticateToken, checkAuth.authRole(2), (req, res) => {
    const qry = "select c.customer_id as id, c.email, c.firstname, c.infix, c.lastname, c.city, c.zipcode, c.street, c.housenumber, c.newsletter, c.userrole_id as userrole, u.name, c.country_id as cid, o.name as cname from customers c INNER join userroles u on c.userrole_id = u.userrole_id inner join countries o on c.country_id = o.country_id where customer_id = ?"
    const params = [req.user.customer_id];

    db.get(qry, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        let user = {
            id: row.id,
            email: row.email,
            firstname: row.firstname,
            infix: row.infix,
            lastname: row.lastname,
            city: row.city,
            zipcode: row.zipcode,
            street: row.street,
            housenumber: row.housenumber,
            newsletter: row.newsletter,
            userrole: {
                id: row.userrole,
                name: row.name
            },
            country: {
                id: row.cid,
                name: row.cname
            }
        }
        res.status(200);
        res.json(user)
    });
});
module.exports = router;
