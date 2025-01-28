const express = require("express");
const axios = require("axios");
const router = express.Router();

module.exports = (db) => {
    // Route to handle POST requests to /advisersubmit
    router.post('/advisersubmit', (req, res) => {
        const { recipeText } = req.body;

        // Validate recipeText input
        if (!recipeText || recipeText.trim() === "") {
            return res.status(400).send("Please provide a recipe.");
        }

        // Extract key ingredients from the recipe text
        const keyIngredients = extractKeyIngredients(recipeText);
        
        // Debugging logs
        console.log("Extracted Ingredients:", keyIngredients);
        console.log("Type of keyIngredients:", typeof keyIngredients);
        console.log("Is keyIngredients an Array?", Array.isArray(keyIngredients));

        // Query the database for matching restaurants
        fetchRestaurantRecommendations(keyIngredients, (err, recommendations) => {
            if (err) {
                console.error("Error fetching recommendations: ", err);
                return res.status(500).send("An error occurred while fetching recommendations.");
            }

            // Handle case where no recommendations are found
            if (!recommendations || recommendations.length === 0) {
                return res.status(404).send("No restaurants found matching the recipe ingredients.");
            }

            // Render the recommendations
            res.render('RestaurantAdviser', { recipes: recommendations });

        });
    });

    return router;
};

// Helper function to extract key ingredients
function extractKeyIngredients(recipeText) {
    console.log("Raw recipeText input:", recipeText);

    if (!recipeText || typeof recipeText !== "string") {
        console.log("Error: Invalid recipeText input");
        return [];
    }

    // Automatically extract ingredients based on words in the input
    const words = recipeText
        .toLowerCase()
        .replace(/[^a-z\s]/g, "") // Remove punctuation
        .split(" ") // Split into words
        .filter(word => word.length > 2); // Remove very short words

    console.log("Extracted ingredients:", words);
    return words.length > 0 ? words : []; // Ensure no default ingredient
}


// Helper function to fetch restaurant recommendations from Google Places API
function fetchRestaurantRecommendations(ingredients, callback) {
    const GOOGLE_API_KEY = 'AIzaSyCCjr0wxL8myd9wPSo2tcszUBU31Wtf-wo';
    const GOOGLE_API_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

    // Ensure `ingredients` is an array before calling `.join()`
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        console.error("Error: Invalid or empty ingredients array", ingredients);
        return callback(new Error("Invalid or empty ingredients array"), null);
    }

    // Join the ingredients into a search query string
    const searchQuery = ingredients.join(", ") + " restaurant";
    console.log("Google Places API Search Query:", searchQuery);

    // Make the API call to Google Places
    axios.get(GOOGLE_API_URL, {
        params: {
            query: searchQuery,
            key: GOOGLE_API_KEY,
        },
    })
    .then((response) => {
        console.log("Google API Response:", response.data);

        if (response.data.status !== "OK") {
            console.error("Google API returned an error:", response.data.status);
            return callback(new Error("Google API error: " + response.data.status), null);
        }

        const results = response.data.results;
        const recommendations = results.map((place) => ({
            name: place.name,
            cuisine: place.types.includes("restaurant") ? "Restaurant" : "Unknown",
            address: place.formatted_address,
            rating: place.rating || "No rating available",
        }));

        callback(null, recommendations);
    })
    .catch((error) => {
        console.error("Error calling Google Places API:", error.response ? error.response.data : error.message);
        callback(error, null);
    });
}
