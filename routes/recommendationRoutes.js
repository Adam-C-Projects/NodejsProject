const express = require("express");
const axios = require("axios");
const router = express.Router();

module.exports = (db) => {  // ✅ Ensure `db` is passed correctly

    //GET route to display restaurant adviser page
    router.get("/", (req, res) => {
        const username = req.session?.username || null;
        res.render("RestaurantAdviser", { 
            recipes: [], 
            message: null, 
            username: username 
        });
    });

    //Submit Recipe for Restaurant Recommendations
    router.post('/advisersubmit', async (req, res) => {
        const { recipeText, filterRating, filterPrice } = req.body;

        if (!recipeText || recipeText.trim() === "") {
            return res.status(400).send('Please provide a recipe.');
        }

        //Extract key ingredients from recipe text
        const keyIngredients = extractKeyIngredients(recipeText);
        console.log("Extracted Ingredients:", keyIngredients);

        //fetch restaurant recommendations using ingredients
        fetchRestaurantRecommendations(keyIngredients, (err, recommendations) => {
            if (err) {
                console.error("Error fetching recommendations:", err);
                return res.status(500).send("An error occurred while fetching recommendations.");
            }

            if (!recommendations || recommendations.length === 0) {
                return res.render("RestaurantAdviser", { 
                    recipes: [], 
                    message: "No restaurants found matching the provided criteria.",
                    username: req.session?.username || null 
                });
            }

            //Filter based on rating and price and price
            let filteredRecommendations = recommendations.filter(r => r.lat && r.lng);

            if (filterRating) {
                filteredRecommendations = filteredRecommendations.filter(r => parseFloat(r.rating) >= parseFloat(filterRating));
            }

            if (filterPrice) {
                filteredRecommendations = filteredRecommendations.filter(r => r.price_level == filterPrice);
            }

            res.render("RestaurantAdviser", { 
                recipes: filteredRecommendations, 
                message: null,
                username: req.session?.username || null 
            });
        });
    });

    //Save a Restaurant to Favorites
    router.post('/saveRestaurant', (req, res) => {
        if (!req.session || !req.session.user_id) {
            return res.status(401).send("You must be logged in to save restaurants.");
        }

        const { name, address, rating, price_level, lat, lng } = req.body;
        const user_id = req.session.user_id; 

        const sql = `
            INSERT INTO saved_restaurants (user_id, restaurant_name, address, rating, price_level, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.query(sql, [user_id, name, address, rating, price_level, lat, lng], (err, result) => {
            if (err) {
                console.error("Error saving restaurant:", err);
                return res.status(500).send("Error saving restaurant.");
            }
            res.send({ success: true, message: "Restaurant saved successfully!" });
        });
    });

    //Get route to retrieve a users saved restaurants
    router.get('/savedRestaurants', (req, res) => {
        if (!req.session || !req.session.user_id) {
            return res.status(401).send("You must be logged in to view saved restaurants.");
        }

        const user_id = req.session.user_id;
        db.query("SELECT * FROM saved_restaurants WHERE user_id = ?", [user_id], (err, results) => {
            if (err) {
                console.error("Error fetching saved restaurants:", err);
                return res.status(500).send("Error fetching saved restaurants.");
            }
            res.render("SavedRestaurants", { savedRestaurants: results });
        });
    });

    //Remove a Restaurant from Favorites
    router.post('/removeRestaurant', (req, res) => {
        if (!req.session || !req.session.user_id) {
            return res.status(401).send("You must be logged in to remove restaurants.");
        }

        const { id } = req.body;
        db.query("DELETE FROM saved_restaurants WHERE id = ?", [id], (err, result) => {
            if (err) {
                console.error("Error removing restaurant:", err);
                return res.status(500).send("Error removing restaurant.");
            }
            res.send({ success: true, message: "Restaurant removed successfully!" });
        });
    });

    //Fetch Details of a Specific Saved Restaurant
    router.get('/restaurantDetails/:id', (req, res) => {
        if (!req.session || !req.session.user_id) {
            return res.status(401).send("You must be logged in to view restaurant details.");
        }

        const restaurant_id = req.params.id;
        const user_id = req.session.user_id;

        db.query("SELECT * FROM saved_restaurants WHERE id = ? AND user_id = ?", [restaurant_id, user_id], (err, results) => {
            if (err) {
                console.error("Error fetching restaurant details:", err);
                return res.status(500).send("Error fetching restaurant details.");
            }

            if (results.length === 0) {
                return res.status(404).send("Restaurant not found.");
            }

            res.render("RestaurantDetails", { restaurant: results[0] });
        });
    });
    return router;
};

//Extract ingredients from recipe text
function extractKeyIngredients(recipeText) {
    return recipeText.toLowerCase().replace(/[^a-z\s]/g, "").split(" ").filter(word => word.length > 2);
}

//Utility function to call Google Places APi with ingredient keyword
function fetchRestaurantRecommendations(ingredients, callback) {
    const GOOGLE_API_KEY = "AIzaSyCCjr0wxL8myd9wPSo2tcszUBU31Wtf-wo"; 
    const GOOGLE_API_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return callback(new Error("Invalid or empty ingredients array"), null);
    }

    const searchQuery = ingredients.join(", ") + " restaurant";

    axios.get(GOOGLE_API_URL, {
        params: { query: searchQuery, key: GOOGLE_API_KEY },
    })
    .then((response) => {
        if (response.data.status !== "OK") {
            return callback(new Error("Google API error: " + response.data.status), null);
        }

        const results = response.data.results.map((place) => ({
            name: place.name,
            address: place.formatted_address,
            rating: place.rating || "No rating available",
            price_level: place.price_level || "Unknown",
            lat: place.geometry?.location?.lat || null,  
            lng: place.geometry?.location?.lng || null  
        })).filter(place => place.lat !== null && place.lng !== null);

        callback(null, results);
    })
    .catch((error) => {
        console.error("Error calling Google Places API:", error.message);
        callback(error, null);
    });
}
