const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {
    
    router.get('/', (req, res) => {
        const username = req.session.username || null;
        res.render('generateRecipe', {username: username} );
    });
    router.get('/userProfile', (req, res) => {
        const username = req.session.username || null;
        res.render('userProfile', {username: username} );
    })
    
    router.post('/saveRecipe', (req, res) => {
        const recipe = req.body;
        const UID = req.session.UID; 
        console.log('Incoming request body:', req.body)
    
        if (!UID) {
            return res.status(401).send("Unauthorized: No user logged in.");
        }

        if (!recipe.diet || recipe.diet.length === 0) {
            recipe.diet = "None";
        }
        if (!recipe.allergies || recipe.allergies.length === 0) {
            recipe.allergies = "None";
        }


        const trimBrackets = (value) => {
            if (typeof value === 'string') {
                return value.replace(/[\[\]{}"]/g, '').trim();
            }
            return value;
        };
        console.log(recipe.TotalCalories);
        recipe.recipeName     = trimBrackets(recipe.recipeName);
        recipe.ingredientName = trimBrackets(recipe.ingredientName);
        recipe.instructions   = trimBrackets(recipe.instructions);
        recipe.diet           = recipe.diet && recipe.diet.length ? trimBrackets(recipe.diet) : "None";
        recipe.allergies      = recipe.allergies && recipe.allergies.length ? trimBrackets(recipe.allergies) : "None";
        recipe.macros         = trimBrackets(recipe.macros);
        recipe.cookingTime    = trimBrackets(recipe.cookingTime);
        recipe.calories       = trimBrackets(recipe.calories);


        const insertRecipeQuery = `
            INSERT INTO Recipes (recipeName, ingredientName, diet, allergies, macros, cookingTime, instructions, calories, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE RID = LAST_INSERT_ID(RID)
        `;
        const recipeValues = [
            recipe.recipeName,
            recipe.ingredientName,
            recipe.diet,
            recipe.allergies,
            recipe.macros,
            recipe.cookingTime,
            recipe.instructions,
            recipe.calories,
            recipe.image
        ];
    
        db.query(insertRecipeQuery, recipeValues, (recipeError, recipeResults) => {
            if (recipeError) {
                console.error('Error saving recipe:', recipeError);
                return res.status(500).send("Failed to save recipe.");
            }
    
            const RID = recipeResults.insertId;
    
            const saveRecipeQuery = `
                INSERT INTO SavedRecipes (UID, RID, saved_at)
                VALUES (?, ?, NOW())
            `;
            const saveRecipeValues = [UID, RID];
    
            db.query(saveRecipeQuery, saveRecipeValues, (saveError) => {
                if (saveError) {
                    console.error('Error saving recipe to SavedRecipes:', saveError);
                    return res.status(500).send("Failed to save recipe.");
                }
    
                res.redirect('/');
            });
        });
    });

    return router;
};