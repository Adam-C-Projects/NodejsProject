const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
    
    router.post('/', (req, res) => {
        const { recipeName, ingredientName, diet, allergies, macros, cookingTime, instructions, calories, image } = req.body;
        const userID = req.session.username; // Ensure you get the correct user ID from session
        const query = `
            INSERT INTO Recipes (recipeName, ingredientName, diet, allergies, macros, cookingTime, instructions, calories, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [recipeName, ingredientName, diet, allergies, macros, cookingTime, instructions, calories, image], (err, result) => {
            if (err) {
                console.error('Error inserting recipe: ', err);
                return res.status(500).send('Error saving recipe');
            }

            res.redirect('/generateRecipe');
        });
    });
    

    return router;
};
