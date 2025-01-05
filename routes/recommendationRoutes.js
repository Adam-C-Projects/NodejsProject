const express = require("express");
const router = express.Router();

module.exports = (db) => {
    router.post('/', (req, res) => {
        const { recipeText } = req.body;

        if (!recipeText || recipeText.trim() == "") {
            return res.status(400).send("Please provide a recipe.");
        }

        // Extracts key ingredients
        const keyIngredients = extractKeyIngredients(recipeText);

        // Queries the database for matching restaurants
        fetchRestaurantRecommendations(db, keyIngredients, (err, recommendations) => {
            if (err) {
                console.error("Error fetching recommendations: ", err);
                return res.status(500).send("An error occurred while fetching recommendations.");
            }

            if (recommendations.length === 0) {
                return res.status(404).send("No restaurants found matching the recipe ingredients.");
            }

            res.json({ recommendations });
        });
    });

    // Helper function to extract key ingredients
    function extractKeyIngredients(recipeText) {
        const ingredients = [];
        const lines = recipeText.split("\n");
        let inIngredientsSection = false;

        for (const line of lines) {
            if (line.trim().toLowerCase() === "ingredients:") {
                inIngredientsSection = true;
                continue;
            }

            if (inIngredientsSection) {
                if (line.trim() === "") break;
                ingredients.push(line.trim().toLowerCase());
            }
        }

        return ingredients;
    }

    // Helper function to fetch restaurant recommendations from the database
    function fetchRestaurantRecommendations(db, ingredients, callback) {
        const placeholders = ingredients.map(() => "?").join(", ");
        const sql = `
            SELECT r.name, r.cuisine, r.address, r.rating
            FROM Restaurants r
            JOIN RestaurantIngredients ri ON r.id = ri.restaurant_id
            WHERE ri.ingredient IN (${placeholders})
            GROUP BY r.id
            ORDER BY COUNT(ri.ingredient) DESC, r.rating DESC
        `;

        db.query(sql, ingredients, (err, results) => {
            if (err) return callback(err, null);

            const recommendations = results.map(row => ({
                name: row.name,
                cuisine: row.cuisine,
                address: row.address,
                rating: row.rating,
            }));

            callback(null, recommendations);
        });
    }

    return router;
};
