//Import necessary modules
const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

module.exports = (db) => {

    //Route to render the recipe generation page
    router.get('/', (req, res) => {
        const username = req.session.username || null;
        res.render('generateRecipe', {username: username} );
    });

    //Route to render user profile page
    router.get('/userProfile', (req, res) => {
        const username = req.session.username || null;
        res.render('userProfile', {username: username} );
    })

    //Route to handle saving generated recipe to the database
    router.post('/saveRecipe', (req, res) => {
        const recipe = req.body;
        const UID = req.session.UID; 
        console.log('Incoming request body:', req.body)

        //If user is not logged in, reject the request
        if (!UID) {
            return res.status(401).send("Unauthorized: No user logged in.");
        }

        //Default to none if diet or allergies are not provided
        if (!recipe.diet || recipe.diet.length === 0) {
            recipe.diet = "None";
        }
        if (!recipe.allergies || recipe.allergies.length === 0) {
            recipe.allergies = "None";
        }

        //remove brackets and quotes from arrays/objects
        const trimBrackets = (value) => {
            if (typeof value === 'string') {
                return value.replace(/[\[\]{}"]/g, '').trim();
            }
            return value;
        };
        //console.log(recipe.TotalCalories);
        //Clean up fields before storing them
        recipe.recipeName     = trimBrackets(recipe.recipeName);
        recipe.ingredientName = trimBrackets(recipe.ingredientName);
        recipe.instructions   = trimBrackets(recipe.instructions);
        recipe.diet           = recipe.diet && recipe.diet.length ? trimBrackets(recipe.diet) : "None";
        recipe.allergies      = recipe.allergies && recipe.allergies.length ? trimBrackets(recipe.allergies) : "None";
        recipe.macros         = trimBrackets(recipe.macros);
        recipe.cookingTime    = trimBrackets(recipe.cookingTime);
        recipe.calories       = trimBrackets(recipe.calories);

        //Query to insert the recipe or update it if it already exists
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

        //save recipe to recipes tablesave recipe to recipes table
        db.query(insertRecipeQuery, recipeValues, (recipeError, recipeResults) => {
            if (recipeError) {
                console.error('Error saving recipe:', recipeError);
                return res.status(500).send("Failed to save recipe.");
            }

            //Get the newly inserted recipe's ID
            const RID = recipeResults.insertId;

            //Save (user+recipe+timestamp) into the table
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

                //On success, redirect to homepage
                res.redirect('/');
            });
        });
    });

    return router;
};