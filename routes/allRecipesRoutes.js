//Import express and create router
const express = require("express");
const router = express.Router();

//Export a function that takes a MySQL connection ('db') and returns the router
module.exports = (db) => {
    //Define get router for "/allRecipes"
    router.get('/', (req, res) => {
        //SQL query to fetch all recipes
        const query = 'SELECT * FROM Recipes';

        //Execute the query
        db.query(query, (err, results) => {
            if (err) {
                console.error("An error occurred while fetching data:", err);
                res.status(500).send("Error fetching data from the database.");
                return;
            }

            //Clean and format macros from string
            results.forEach(recipe => {
                if (recipe.macros) {
                    recipe.macros = recipe.macros
                    .replace(/"/g, '')          //Remove quotes
                    .split(',')                 //Split comma
                    .map(macro => macro.trim()); //Trim each value
                }
            });

            //Clean and format the 'ingredientName' field from string to an array
            results.forEach(recipe => {
                if (recipe.ingredientName) {
                    recipe.ingredientName = recipe.ingredientName
                    .replace(/"/g, '')                              //Remove quotes
                    .split(',')                                     //Split by comma
                    .map(ingredientName => ingredientName.trim());  //Trim
                }
            });

            //Retrieve the username from session
            const username = req.session.username || null;
            console.log(username)

            //Render the EJS views 'allRecipes' with the fetched recipes and username
            res.render('allRecipes', { recipes: results, username: username });
        });
    });

return router
};