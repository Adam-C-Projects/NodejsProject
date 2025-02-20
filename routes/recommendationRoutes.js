const express = require("express");
const axios = require("axios");
const router = express.Router();

module.exports = (db) => {
    router.get("/", (req, res) => {
        const username = req.session?.username || null;
        res.render("RestaurantAdviser", { 
            recipes: [], 
            message: null, 
            username: username 
        });
    });

    router.post('/advisersubmit', async (req, res) => {
        const { recipeText, filterRating, filterCuisine, filterPrice, filterRestaurantType } = req.body;

        if (!recipeText || recipeText.trim() === "") {
            return res.status(400).send('Please provide a recipe.');
        }

        const keyIngredients = extractKeyIngredients(recipeText);
        console.log("Extracted Ingredients:", keyIngredients);

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

            // Apply filters
            let filteredRecommendations = recommendations.filter(r => r.lat && r.lng); // ✅ Remove restaurants missing location data

            if (filterRating) {
                filteredRecommendations = filteredRecommendations.filter(r => parseFloat(r.rating) >= parseFloat(filterRating));
            }

            if (filterCuisine) {
                filteredRecommendations = filteredRecommendations.filter(r => r.cuisine.toLowerCase().includes(filterCuisine.toLowerCase()));
            }

            if (filterPrice) {
                filteredRecommendations = filteredRecommendations.filter(r => r.price_level == filterPrice);
            }

            if (filterRestaurantType) {
                filteredRecommendations = filteredRecommendations.filter(r => r.types.includes(filterRestaurantType));
            }

            res.render("RestaurantAdviser", { 
                recipes: filteredRecommendations, 
                message: null,
                username: req.session?.username || null 
            });
        });
    });

    return router;
};

// ✅ Extract Ingredients Function
function extractKeyIngredients(recipeText) {
    return recipeText.toLowerCase().replace(/[^a-z\s]/g, "").split(" ").filter(word => word.length > 2);
}

// ✅ Fetch Restaurant Data from Google Places API
function fetchRestaurantRecommendations(ingredients, callback) {
    const GOOGLE_API_KEY = "AIzaSyCCjr0wxL8myd9wPSo2tcszUBU31Wtf-wo"; // Replace with your actual API key
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
            cuisine: place.types.includes("restaurant") ? "Restaurant" : "Unknown",
            address: place.formatted_address,
            rating: place.rating || "No rating available",
            price_level: place.price_level || "Unknown",
            types: place.types || [],
            lat: place.geometry?.location?.lat || null,  // ✅ Ensure lat exists
            lng: place.geometry?.location?.lng || null  // ✅ Ensure lng exists
        })).filter(place => place.lat !== null && place.lng !== null); // ✅ Filter out invalid locations

        callback(null, results);
    })
    .catch((error) => {
        console.error("Error calling Google Places API:", error.message);
        callback(error, null);
    });
}
