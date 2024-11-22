const express = require('express');
const { message } = require('statuses');
const checkAuth = require("../middleware/checkAuth")
const router = express.Router();
const db = require("../database/database");


router.get('/', (req, res) => {
    const qry = "select country_id as id, name from countries";
    const params = [];

    db.all(qry, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.meassage });
            return;
        }
        res.json({
            countries: rows
        });
    });
});


router.get('/:id', (req, res) => {
    let qry = "select country_id as id, name from countries where country_id = ?"
    let params = [req.params.id];
    db.get(qry, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row == null) {
            res.status(404).json({ message: "land " + req.params.id + " bestaat niet" })
            return;
        }
        res.status(200);
        res.json(row);
    });
});


router.post("/", checkAuth.authenticateToken, checkAuth.authRole(3), (req, res) => {

    let errors = [];

    if (!req.body.name.match(/^[a-zA-Z]{2}[\sa-zA-Z]*$/)) {
        errors.push("Land naam moet tenminste 2 karakters bevatten")
    }
    if (errors.length) {
        res.status(400).json({ errors });
        return;
    }

    let qry = "insert into countries (name) values (?)";
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
        errors.push("Land naam moet tenminste 2 karakters bevatten en mag alleen letters en spaties bevatten")
    }
    if (errors.length) {
        res.status(400).json({ errors });
        return;
    }
    let qry = "UPDATE countries set name = coalesce(?,name) where country_id = ?"
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
    let qry = "delete from countries where country_id = ?"
    let params = [req.params.id]
    db.run(qry, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404);
            res.json({
                message: 'Land ' + req.params.id + ' Niet gevonden.',
            });
        } else {
            res.status(200)
            res.json({
                message: "success"
            })
        }
    })
});


module.exports = router;
