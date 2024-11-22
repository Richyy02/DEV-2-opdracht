const express = require('express');
const { message } = require('statuses');
const checkAuth = require("../middleware/checkAuth")
const router = express.Router();
const db = require("../database/database");

router.get('/', (req, res) => {
    const qry = "select category_id as id, name from categories";
    const params = [];

    db.all(qry, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.meassage });
            return;
        }
        res.json({
            categories: rows
        });
    });
});

router.get('/:id', (req, res) => {
    let qry = "select category_id as id, name from categories where category_id = ?"
    let params = [req.params.id];
    db.get(qry, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row == null) {
            res.status(404).json({ message: "categorie " + req.params.id + " bestaat niet" })
            return;
        }
        res.status(200);
        res.json(row);
    });
});

router.get('/:id/products', (req, res) => {
    let qry = "select product_id as id, code, title, description, price, stock, category_id, round(price*1.21) as price_vat from products where category_id = ?"
    let params = [req.params.id];
    db.all(qry, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row.length == 0) {
            res.status(404).json({ message: "Er zijn geen producten in categorie " + req.params.id + " of de categorie bestaat niet" })
            return;
        }
        res.status(200);
        res.json({
            products: row
        });
    });
});


router.post("/", checkAuth.authenticateToken, checkAuth.authRole(3), (req, res) => {

    let errors = [];

    if (!req.body.name.match(/^[a-zA-Z]{2}[\sa-zA-Z]*$/)) {
        errors.push("Categorie naam moet tenminste 2 karakters bevatten en mag alleen letters en spaties bevatten")
    }
    if (errors.length) {
        res.status(400).json({ errors });
        return;
    }

    let qry = "insert into categories (name) values (?)";
    let params = [
        req.body.name
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

    if (!req.body.name.match(/^[a-zA-Z]{2}[\sa-zA-Z]*$/)) {
        errors.push("Categorie naam moet tenminste 2 karakters bevatten en mag alleen letters en spaties bevatten")
    }
    if (errors.length) {
        res.status(400).json({ errors });
        return;
    }
    let qry = "UPDATE categories set name = coalesce(?,name) where category_id = ?"
    let params = [
        req.body.name,
        req.params.id
    ];

    db.run(qry, params, function (err, result) {
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
    let qry = "select * from products where category_id =?"
    let params = [req.params.id]

    let qry2 = "delete from categories where category_id = ?"
    let params2 = [req.params.id]

    db.get(qry, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.status(200);
        if (row == undefined) {
            db.run(qry2, params2, function (errs) {
                if (err) {
                    res.status(400).json({ error: errs.message });
                    return;
                }
                if (this.changes === 0) {
                    res.status(404);
                    res.json({
                        message: 'Category ' + req.params.id + ' Niet gevonden.',
                    });
                } else {
                    res.status(200)
                    res.json({
                        message: "success"
                    })
                }
            })
        } else {
            res.status(400)
            res.json({
                message: "Deze categorie bevat producten en kan daarom niet verwijderd worden"
            })
        }

    });
});


module.exports = router;
