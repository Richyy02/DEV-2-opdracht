const express = require('express');
const { message } = require('statuses');
const checkAuth = require("../middleware/checkAuth")
const router = express.Router();
const db = require("../database/database");

router.get('/', (req, res) => {
    const qry = "select * from orders";
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

router.post("/", checkAuth.authenticateToken, checkAuth.authRole(2), (req, res) => {

    let qry = "insert into order_lines (product_id, amount) values (?,?)";
    let params = [
        req.body.product,
        req.body.amount
    ]
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

module.exports = router;