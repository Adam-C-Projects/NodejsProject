const express = require("express");
const router = express.Router();

module.exports = (db) => {
    router.get('/', (req, res) => {
        const username = req.session.username;
        if (!username) {
            return res.redirect('/login'); // If the user is not logged in, redirect to login
        }
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
    
                if (recipeResults.length === 0) {
                    return res.send('No saved recipes found for this user.');
                }
    
                res.render('savedRecipes', { recipes: recipeResults });
            }
        );
    });
    return router;
};
