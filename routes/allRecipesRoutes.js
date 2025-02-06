const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');

router.get('/allRecipes', (req, res) => {
    db.query('SELECT * FROM Recipes', (err, results) => {
        if (err) {
            console.error('Error fetching all recipes: ', err);
            return res.status(500).send('Error fetching all recipes');
        }
        const username = req.session.username || null;
        res.render('allRecipes', { recipes: results, username: username  });
    });
});

module.exports = router