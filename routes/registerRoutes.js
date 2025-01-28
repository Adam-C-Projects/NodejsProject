const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

module.exports = (db) => {
    // Render the registration page
    router.get('/', (req, res) => {
        res.render('register'); // Adjust path to your template
    });

    // Handle user registration
    router.post("/registerSubmit", async (req, res) => {
        const { email, username, password } = req.body;

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).send("Invalid email");
        }

        try {
            // Hash the password
            const password_hash = await bcrypt.hash(password, 10);

            // Check if username already exists
            db.query("SELECT * FROM User WHERE username = ?", [username], (err, results) => {
                if (err) {
                    console.error("Database query error:", err);
                    return res.status(500).send("Database error");
                }

                if (results.length > 0) {
                    return res.status(409).send("User already exists");
                }

                // Insert new user into the database
                db.query(
                    "INSERT INTO User (username, password_hash, email, created_at) VALUES (?, ?, ?, NOW())",
                    [username, password_hash, email],
                    (err, results) => {
                        if (err) {
                            console.error("Database query error:", err);
                            return res.status(500).send("Database error");
                        }

                        // Set session and redirect to homepage
                        req.session.username = username;
                        req.session.loggedIn = true;
                        res.redirect("/");
                    }
                );
            });
        } catch (err) {
            console.error("Error hashing password:", err);
            return res.status(500).send("Internal server error");
        }
    });


    //function to make sure email submission is a valid email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    return router;
};
