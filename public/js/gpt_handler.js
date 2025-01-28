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

async function callOpenAI(ingredients) {
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const apiHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
    };
    const apiBody = {
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a chef who generates recipes based on a list of ingredients provided. Please return the recipe in JSON format, including the title, ingredients, instructions, macros (protein, carbs, fat, fiber, sugar, sodium), total calories, allergies, prep time (in minutes), cook time (in minutes) and servings. Avoid leaving any field undefined or null" },
            { role: "user", content: `Generate a recipe for the following ingredients: ${ingredients}` },
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
        <form action="/saveRecipe" method="POST">
            <input type="hidden" name="recipeName" value="${recipe.title}">
            <input type="hidden" name="ingredientName" value='${JSON.stringify(recipe.ingredients)}'>
            <input type="hidden" name="instructions" value='${JSON.stringify(recipe.instructions)}'>
            <input type="hidden" name="dietaryReq" value='${JSON.stringify(recipe.allergies) || 'none'}'>
            <input type="hidden" name="macros" value='${JSON.stringify(recipe.macros)}'>
            <input type="hidden" name="TotalCalories" value='${JSON.stringify(recipe.total_calories)}'>
            <input type="hidden" name="cookingTime" value="${recipe.cookTime || '0'}">
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
            const recipeCard = renderRecipe(recipe, i);
            recipeOutput.appendChild(recipeCard);
        }
}


