const express = require('express');
const jwt = require('jsonwebtoken')


const roleName = [
    "",
    "unprotected",
    "user",
    "admin"
]


function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) {
        res.status(401)
        res.json({
            message: "Unauthorized"
        })
        return;
    }
    // verified de token van de user en geeft ook een status 403 als de token fout of ongeldig is
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            res.status(403)
            res.json({
                message: "Forbidden"
            })
            return;
        }
        req.user = user
        next()
    })
}
// Functie die checkt of de role hoger is dan een bepaalde waarde en bepaald zo dus waar je wel of niet bij mag
function authRole(role) {
    return (req, res, next) => {
        if (req.user.userrole_id < role) {
            res.status(401)
            console.log("You have no access, because you're a " + roleName[req.user.userrole_id] + "!");
            return res.send("You have no access, because you're a " + roleName[req.user.userrole_id] + "!")
        }
        console.log("You have access, because you're an " + roleName[req.user.userrole_id] + "!");

        next()
    }
}



module.exports = {
    authenticateToken,
    authRole,
};