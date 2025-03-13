const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

module.exports = (db) => {
    // Render the registration page
    router.get("/", (req, res) => {
        res.render("register"); // Ensure this path matches your actual template location
    });

    // Handle user registration
    router.post("/registerSubmit", async (req, res) => {
        const { email, username, password, weight, height, goal } = req.body;

        // Validate input fields
        if (!isValidEmail(email)) {
            return res.status(400).json("Invalid email format");
        }
        if (!username || !password || !weight || !height || !goal) {
            return res.status(400).json("All fields are required");
        }

        try {
            // Hash the password
            const password_hash = await bcrypt.hash(password, 10);

            // Check if username or email already exists
            db.query(
                "SELECT * FROM User WHERE username = ? OR email = ?", 
                [username, email], 
                (err, results) => {
                    if (err) {
                        console.error("Database query error:", err);
                        return res.status(500).json("Database error");
                    }

                    if (results.length > 0) {
                        const usernameExists = results.some(user => user.username === username);
                        const emailExists = results.some(user => user.email === email);
                        
                        if (usernameExists) {
                            return res.status(409).send("Username already exists");
                        }
                        if (emailExists) {
                            return res.status(409).send("Email already exists");
                        }
                    }

                    // Insert new user into the database (including weight, height, and goal)
                    db.query(
                        "INSERT INTO User (username, password_hash, email, weight, height, goal, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                        [username, password_hash, email, weight, height, goal],
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

                            res.redirect("/userProfile"); // Redirect to profile page after registration
                        }
                    );
                }
            );
        } catch (err) {
            console.error("Error hashing password:", err);
            return res.status(500).send("Internal server error");
        }
    });

    // Function to validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    return router;
};
