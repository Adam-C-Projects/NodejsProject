const express = require("express");
const router = express.Router();

module.exports = (db) => {
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM Recipes';

        db.query(query, (err, results) => {
            if (err) {
                console.error("An error occurred while fetching data:", err);
                res.status(500).send("Error fetching data from the database.");
                return;
            }
            
            results.forEach(recipe => {
                if (recipe.macros) {
                    recipe.macros = recipe.macros
                    .replace(/"/g, '')
                    .split(',')
                    .map(macro => macro.trim());
                }
            });

            results.forEach(recipe => {
                if (recipe.ingredientName) {
                    recipe.ingredientName = recipe.ingredientName
                    .replace(/"/g, '')
                    .split(',')
                    .map(ingredientName => ingredientName.trim());
                }
            });
            const username = req.session.username || null;
            console.log(username)
            res.render('allRecipes', { recipes: results, username: username });
        });
    });

return router
};