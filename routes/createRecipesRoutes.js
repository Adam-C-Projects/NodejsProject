//Import express and create router
const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');


module.exports = (db) => {

    //Handle POST request to create a new recipe
    router.post('/', (req, res) => {
        //Destruct submitted recipe fields from body
        const { recipeName, ingredientName, diet, allergies, macros, cookingTime, instructions, calories, image } = req.body;
        //Get users ID or username from session
        const userID = req.session.username; // Ensure you get the correct user ID from session
        //SQL query to insert recipe into recipes table
        const query = `
            INSERT INTO Recipes (recipeName, ingredientName, diet, allergies, macros, cookingTime, instructions, calories, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        //Execute the query with values
        db.query(query, [recipeName, ingredientName, diet, allergies, macros, cookingTime, instructions, calories, image], (err, result) => {
            if (err) {
                console.error('Error inserting recipe: ', err);
                return res.status(500).send('Error saving recipe');
            }
            //Redirect user to the generateRecipe page after insert
            res.redirect('/generateRecipe');
        });
    });
    

    return router;
};
