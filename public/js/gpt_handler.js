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
    const data = await fetchFromAPI(apiUrl, "POST", apiHeaders, apiBody);
    const recipeContent = data.choices[0].message.content;
    return JSON.parse(recipeContent);
}
function renderRecipe(recipe, index) {
    const recipeText = `
        <h3>Recipe ${index + 1}: ${recipe.title}</h3>
        <p><b>Ingredients:</b><br>${recipe.ingredients.join("<br>")}</p>
        <p><b>Instructions:</b><br>${recipe.instructions.join("<br>")}</p>
        <p><b>Macronutrients:</b><br>
            Protein: ${recipe.macros.protein}, 
            Carbs: ${recipe.macros.carbs}, 
            Fat: ${recipe.macros.fat},
            Fiber: ${recipe.macros.fiber}, 
            Sugar: ${recipe.macros.sugar}, 
            Sodium: ${recipe.macros.sodium}</p>
        <p><b>Total Calories:</b> ${recipe.total_calories} kcal</p>
        <p><b>Allergies:</b> ${recipe.allergies.join(", ")||"None"}</p>
        <p>Prep Time: ${recipe.prepTime||"Not specified"} minutes</p>
        <p>Cook Time: ${recipe.cookTime ||"Not specified"} minutes</p>
        <p>Servings: ${recipe.servings}</p>
        <img src="${recipe.image}" alt="Image for ${recipe.title}" onerror="this.onerror=null; this.src='fallback-image.png';" style="width: 100px; height: auto;">
        <form action="/saveRecipe" method="POST">
            <input type="hidden" name="recipeName" value="${recipe.title}">
            <input type="hidden" name="ingredientName" value='${JSON.stringify(recipe.ingredients)}'>
            <input type="hidden" name="instructions" value='${JSON.stringify(recipe.instructions)}'>
            <input type="hidden" name="dietaryReq" value='${JSON.stringify(recipe.allergies) || 'none'}'>
            <input type="hidden" name="macros" value='${JSON.stringify(recipe.macros)}'>
            <input type="hidden" name="TotalCalories" value='${JSON.stringify(recipe.total_calories)}'>
            <input type="hidden" name="cookingTime" value="${recipe.cookTime || '0'}">
            <input type="hidden" name="image" value="${recipe.image}">
            <button type="submit" class="save-recipe">Save Recipe</button>
        </form>
    `;
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-card");
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


