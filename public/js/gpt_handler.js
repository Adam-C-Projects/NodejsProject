document.getElementById("enter-button").addEventListener("click", generateRecipe);

async function fetchFromAPI(url, method, headers, body) {
    try {
        const response = await fetch(url, { method, headers, body: JSON.stringify(body) });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in API call:", error);
        throw error;
    }
}

async function generateImage(recipe) {
    try {
        const apiUrl = "https://api.openai.com/v1/images/generations";
        const apiHeaders = {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`,
        };
        const apiBody = {
            prompt: `Generate an image for the following recipe: ${recipe.title}.}`,
            n: 1,
            size: "512x512",
        };

        const data = await fetchFromAPI(apiUrl, "POST", apiHeaders, apiBody);
        if (data.data && data.data[0] && data.data[0].url) {
            return data.data[0].url;
        } else {
            throw new Error("Image generation failed");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        return "fallback-image.png";  // Return fallback image URL on error
    }
}

async function callOpenAI(ingredients) {
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const apiHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
    };
    const apiBody = {
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a chef who creates recipes based on a list of ingredients. Please return a JSON object with the following structure: {title, ingredients[], instructions[], macros: {protein, carbs, fat, fiber, sugar, sodium}, total_calories, allergies[], prepTime, cookTime, servings}. Don't leave any field undefined or null." },
            { role: "user", content: `Generate a recipe for these ingredients: ${ingredients}` },
        ],
    };
    const maxRetries = 5; // Max retries
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const data = await fetchFromAPI(apiUrl, "POST", apiHeaders, apiBody);
            const recipeContent = data.choices[0].message.content;

            // Attempt to parse the response into JSON
            const parsedRecipe = JSON.parse(recipeContent);

            // If JSON parsing is successful, return the parsed recipe
            return parsedRecipe;
        } catch (error) {
            console.error("Error parsing or fetching recipe, attempt:", attempt + 1, error);
            attempt++;
            if (attempt >= maxRetries) {
                console.error("Max retries reached, failed to get valid JSON.");
                throw new Error("Failed to generate a valid recipe after multiple attempts");
            }
        }
    }
}
function renderRecipe(recipe, index) {
    const recipeText = `
        <div data-id="${index}" class="bg-gray-100 shadow-md rounded-lg relative">
            <img src="${recipe.image}" alt="Image for ${recipe.title}" class="w-72 h-72 object-cover absolute top-4 right-4 p-2 rounded-lg shadow-md" />
            <h3 class="text-lg font-bold text-gray-800 p-6">${recipe.title}</h3>

            <div class="px-6 py-4">
                <p class="mt-2"><b>Ingredients:</b></p>
                <ul class="list-disc list-inside text-sm text-gray-600">
                    ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
                <p class="mt-2"><b>Instructions:</b></p>
                <p class="text-sm text-gray-600">${recipe.instructions.join('<br>')}</p>
                <p class="mt-2"><b>Macronutrients:</b></p>
                <ul class="list-disc list-inside text-sm text-gray-600">
                    <li>Protein: ${recipe.macros.protein}g</li>
                    <li>Carbs: ${recipe.macros.carbs}g</li>
                    <li>Fat: ${recipe.macros.fat}g</li>
                    <li>Fiber: ${recipe.macros.fiber}g</li>
                    <li>Sugar: ${recipe.macros.sugar}g</li>
                    <li>Sodium: ${recipe.macros.sodium}g</li>
                </ul>
                <p class="mt-2"><b>Total Calories:</b> <span class="text-gray-600">${recipe.total_calories} KCAL</span></p>
                <p class="mt-2"><b>Dietary requirements:</b> <span class="text-gray-600">${recipe.allergies.join(', ') || 'None'}</span></p>
                <p class="mt-2"><b>Cook Time:</b> <span class="text-gray-600">${recipe.cookTime || 'Not specified'} minutes</span></p>
                <form action="generateRecipe/saveRecipe" method="POST" class="mt-4">
                    <input type="hidden" name="recipeName" value="${recipe.title}">
                    <input type="hidden" name="ingredientName" value='${JSON.stringify(recipe.ingredients)}'>
                    <input type="hidden" name="instructions" value='${JSON.stringify(recipe.instructions)}'>
                    <input type="hidden" name="dietaryReq" value='${JSON.stringify(recipe.allergies) || 'none'}'>
                    <input type="hidden" name="macros" value='${JSON.stringify(recipe.macros)}'>
                    <input type="hidden" name="TotalCalories" value='${JSON.stringify(recipe.total_calories)}'>
                    <input type="hidden" name="cookingTime" value="${recipe.cookTime || '0'}">
                    <input type="hidden" name="image" value="${recipe.image}">
                    <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Save Recipe</button>
                </form>
            </div>
        </div>
    `;
    const recipeDiv = document.createElement("div");
    recipeDiv.innerHTML = recipeText;
    return recipeDiv;
}
async function generateRecipe() {
    const ingredients= document.getElementById("ingredients-input").value;
    const recipeCount=parseInt(document.getElementById("recipeCount").value, 10);
    const recipeOutput= document.getElementById("recipe-text");
        for (let i = 0;i < recipeCount; i++) {
            const recipe = await callOpenAI(ingredients);
            const imageUrl = await generateImage(recipe); // Generate the image
            recipe.image = imageUrl;
            const recipeCard = renderRecipe(recipe, i);
            recipeOutput.appendChild(recipeCard);
        }
}


