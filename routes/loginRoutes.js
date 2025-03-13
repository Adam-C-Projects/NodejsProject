const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
    // Route to render login page
    router.get('/', (req, res) => {
        res.render('login'); // Render the login view
    });

    // Redirect to login page if necessary
    router.get('/redirect-login', (req, res) => {
        res.redirect('/login');  // Redirect to login
    });

    // Login form submission
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
                        req.session.user_id = user.UID;
                        req.session.loggedIn = true;

                        console.log("User logged in. Session data:", req.session);

                        // Redirect to homepage or dashboard
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
