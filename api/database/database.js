require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.DB_NAME;
console.log('Resolved DB Path:', dbPath);
module.exports = new sqlite3.Database(process.env.DB_NAME || 'database/db.sqlite', (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('connected to the SQLite database.');
        
    }
});