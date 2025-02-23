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
            return res.status(400).json("Invalid email");
        }

        try {
            // Hash the password
            const password_hash = await bcrypt.hash(password, 10);

            // Check if username already exists
            db.query("SELECT * FROM User WHERE username = ? OR email = ?", [username,email], (err, results) => {
                if (err) {
                    console.error("Database query error:", err);
                    return res.status(500).json("Database error");
                }

                if (results.length > 0) {
                    const usernameExists = results.some(user => user.username === username);
                    const emailExists = results.some(user => user.email === email);
                    console.log(usernameExists);
                    if (usernameExists) {
                        console.log("here");
                        return res.status(409).send("User already exists");
                    }
                    if (emailExists) {

                        return res.status(409).send("Email already exists");
                    }
                }
                
                // Insert new user into the database
                db.query(
                    "INSERT INTO User (username, password_hash, email, created_at) VALUES (?, ?, ?, NOW())",
                    [username, password_hash, email],
                    (err, results) => {
                        if (err) {
                            console.error("Database query error:", err);
                            return res.status(500).json("Database error");
                        }
                        let UID = results.insertId;
                        // Set session and redirect to homepage
                        req.session.username = username;
                        req.session.UID = UID;
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
