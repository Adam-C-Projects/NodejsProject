//Import necessary modules
const express = require("express");
const router = express.Router();

module.exports = (db) => {

    //GET route to view saved recipes for the current user
    router.get('/:username?', (req, res) => {
        //Get username from URL parameter or session
        let username = req.params.username || req.session.username;

        //If no user is logged in or specified and redirect to login page
        if (!username) {
            return res.redirect('/login'); // If the user is not logged in, redirect to login
        }
        //Querry to fetch all recipes saved by user
        db.query(
            `SELECT r.*
             FROM SavedRecipes sr
             JOIN Recipes r ON sr.RID = r.RID
             JOIN User u ON sr.UID = u.UID
             WHERE u.username = ?`,
            [username],
            (err, recipeResults) => {
                if (err) {
                    console.error('Error fetching saved recipes: ', err);
                    return res.status(500).send('Error fetching saved recipes');
                }

                //Format macros field into an array
                recipeResults.forEach(recipe => {
                    if (recipe.macros) {
                        recipe.macros = recipe.macros
                        .replace(/"/g, '')
                        .split(',')
                        .map(macro => macro.trim());
                    }
                });

                //Format the ingredientName field into an array
                recipeResults.forEach(recipe => {
                    if (recipe.ingredientName) {
                        recipe.ingredientName = recipe.ingredientName
                        .replace(/"/g, '')
                        .split(',')
                        .map(ingredientName => ingredientName.trim());
                    }
                });
                console.log(recipeResults);
                //Render the savedRecipes EJS page with recipe results
                const username = req.session.username || null;
                res.render('savedRecipes', { recipes: recipeResults, username: username });
            }
        );
    });

    //DELETE route to remove a saved recipe for the logged-in user
    router.delete('/remove/:rid', (req, res) => {
        const username = req.session.username;
        const recipeId = req.params.rid;
        console.log(recipeId);

        //Delete the saved recipe based on the RID and username
        db.query(
            `DELETE sr
             FROM SavedRecipes sr
             JOIN User u ON sr.UID = u.UID
             WHERE sr.RID = ? AND u.username = ?`,
            [recipeId, username],
            (err, result) => {
                if (err) {
                    console.error('Error removing recipe: ', err);
                    return res.status(500).send('Error removing recipe');
                }

                if (result.affectedRows === 0) {
                    return res.status(404).send('Recipe not found or not saved by this user.');
                }

                res.status(200).json({ message: 'Recipe removed successfully!' });
            }
        );
    });

    
    return router;
};
