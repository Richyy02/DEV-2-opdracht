const express = require('express');
const { message } = require('statuses');
const checkAuth = require("../middleware/checkAuth")

const router = express.Router();
const db = require("../database/database");

router.get("/", (req, res) => {
    const qry = "select product_id as id, code, title, description, price, stock, category_id, round(price*1.21) as price_vat from products";
    const params = [];
    if (req.query.q == null) {
        db.all(qry, params, (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.meassage });
                return;
            }
            res.status(200)
            res.json({
                products: rows
            });
        });
    } else {
        let qrys = "select product_id as id, code, title, description, price, stock, category_id, round(price*1.21) as price_vat, title || description as search from products where"
        let searchTerms = req.query.q.split(" ")
        qrys += searchTerms.map(word => " search like '%'|| ? ||'%'").join(" and")
        if (req.query.q == "") {
            res.status(404).json({ message: "vul alstublieft een zoekterm in" })
            return;
        }
        db.all(qrys, searchTerms, (err, row) => {
            if (err) {
                res.status(400).json({ error: err });
                return;
            }
            if (row.length == 0) {
                res.status(404).json({ message: "Wij vonden geen producten voor jouw zoekresultaat!" })
            } else {
                res.status(200);
                res.json({
                    products: row
                })
            }
        });

    }
});


router.get('/:id', (req, res) => {
    const qry = "select product_id as id, code, title, description, price, stock, category_id, round(price*1.21) as price_vat from products where product_id = ?"
    const params = [req.params.id];
    db.get(qry, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row == null) {
            res.status(404).json({ message: "product " + req.params.id + " bestaat niet" })
            return;
        }
        res.status(200);
        res.json(row)
    });
});


router.post("/", checkAuth.authenticateToken, checkAuth.authRole(3), (req, res) => {

    let errors = [];

    if (!req.body.code.match(/^[A-Za-z0-9\s\-]+$/)) {
        errors.push("Code mag alleen letters, cijfers, witruimtes en dashes bevatten")
    }
    if (!req.body.title.match(/^[a-zA-Z]{2}[\sa-zA-Z]*$/)) {
        errors.push("Title mag alleen letters, cijfers, witruimtes en dashes bevatten")
    }
    if (!req.body.description.match(/^[a-zA-Z]{2}[\sa-zA-Z]*$/)) {
        errors.push("Description mag alleen letters, cijfers, witruimtes en dashes bevatten")
    }
    if (errors.length) {
        res.status(400).json({ errors });
        return;
    }

    let qry = "insert into products (code, title, description, price, supplier, dateadd, stock, category_id) values (?,?,?,round(?,0),?,?,?,?)";
    let params = [
        req.body.code,
        req.body.title,
        req.body.description,
        req.body.price,
        req.body.supplier,
        req.body.dateadd,
        req.body.stock,
        req.body.category_id
    ];
    db.run(qry, params, function (err) {
        if (err) {
            res.status(400)
            return;
        }
        res.status(200)
        res.json({
            message: "success"
        })
    }
    )
})

router.patch("/:id", checkAuth.authenticateToken, checkAuth.authRole(3), (req, res) => {

    let errors = [];

    if (req.body.code !== undefined) {
        const regExCheck = !!req.body.code.match(/^[A-Za-z0-9\s\-]+$/)
        if (!regExCheck) {
            errors.push("Code mag alleen letters, cijfers, witruimtes en dashes bevatten")
        }
    }

    if (req.body.title !== undefined) {
        const regExCheck = !!req.body.title.match(/^[A-Za-z0-9\s\-]+$/)
        if (!regExCheck) {
            errors.push("Title mag alleen letters, cijfers, witruimtes en dashes bevatten")
        }
    }

    if (req.body.description !== undefined) {
        const regExCheck = !!req.body.description.match(/^[A-Za-z0-9\s\-]+$/)
        if (!regExCheck) {
            errors.push("Description mag alleen letters, cijfers, witruimtes en dashes bevatten")
        }
    }

    if (errors.length) {
        res.status(400).json({ errors });
        return;
    }

    let qry = "UPDATE products set code = coalesce(?,code), title = coalesce(?,title), description = coalesce(?,description), price = coalesce(round(?,0),price), supplier = coalesce(?,supplier), dateadd = coalesce(?,dateadd), stock = coalesce(?,stock), category_id = coalesce(?,category_id) where product_id = ?"
    let params = [
        req.body.code,
        req.body.title,
        req.body.description,
        req.body.price,
        req.body.supplier,
        req.body.dateadd,
        req.body.stock,
        req.body.category_id,
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
})

router.delete("/:id", checkAuth.authenticateToken, checkAuth.authRole(3), (req, res) => {
    let qry = "delete from products where product_id = ?"
    let params = [req.params.id]
    db.run(qry, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404);
            res.json({
                message: 'Product ' + req.params.id + ' Niet gevonden.',
            });
        } else {
            res.status(200)
            res.json({
                message: "success"
            })
        }
    })
});
// Geef de router aan het bestand die deze module heeft ge-required.
// Dit bestand is in dit geval index.js
module.exports = router;
