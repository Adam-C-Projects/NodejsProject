const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
    
    router.post('/', (req, res) => {
        const { title, ingredients, instructions } = req.body;
        const userID = req.session.username; // Ensure you get the correct user ID from session
        const query = `
            INSERT INTO Recipes (title, ingredients, instructions, macros, allergies, user_id)
            VALUES (?, ?, ?, ?, ?, ?)`;
        db.query(query, [title, ingredients, instructions, userId], (err, result) => {
            if (err) {
                console.error('Error inserting recipe: ', err);
                return res.status(500).send('Error saving recipe');
            }
            res.status(200).send('Recipe created successfully');
        });
    });
    

    return router;
};
