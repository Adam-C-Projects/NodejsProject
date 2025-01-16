const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
    // This route redirects to login.html
    router.get('/', (req, res) => {
        res.render('login'); // Render the login view
    });

    // This route handles the redirection to the login page
    router.get('/redirect-login', (req, res) => {
        res.redirect('/login');  // This redirects to login.html
    });

    // This runs when the login form is submitted
    router.post('/submit', (req, res) => {
        const { username, password } = req.body;

        // Query database to find user by username
        db.query('SELECT * FROM User WHERE username = ?', [username], (err, results) => {
            if (err) {
                console.error('Database query error: ', err);
                return res.status(500).send('Database error');
            }

            if (results.length > 0) {
                const user = results[0];

                // Check if the password matches
                bcrypt.compare(password, user.password_hash, (err, isMatch) => {
                    if (err) {
                        console.error('Error comparing passwords: ', err);
                        return res.status(500).send('Error comparing passwords');
                    }

                    if (isMatch) {
                        // Store user info in session
                        req.session.username = username;
                        req.session.UID = user.UID;
                        req.session.loggedIn = true;

                        // Redirect to homepage
                        res.redirect('/');
                    } else {
                        res.status(401).send('Invalid credentials');
                    }
                });
            } else {
                res.status(401).send('Invalid credentials');
            }
        });
    });

    return router;
};

