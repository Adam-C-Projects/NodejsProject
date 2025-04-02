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
            prompt: `Generate an image for the following recipe: ${recipe.title}.`,
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

function checkAllergens(recipe){
    //List of common allergens
    const commonAllergens = ['egg', 'peanuts', 'dairy', 'wheat', 'soy', 'fish', 'shellfish', 'tree nuts', 'milk', 'peanuts', 'almonds', 'walnuts', 'cashews', 'pecans', 'pistachios', 'brazil nuts', 'hazelnuts', 'macadamia nuts', 'soy', 'soybeans', 'tofu', 'soy milk', 'wheat', 'fish', 'salmon', 'tuna', 'cod', 'shrimp', 'crab', 'lobster', 'clams', 'mussels', 'oysters'];
    recipe.allergies= recipe.allergies||[];

    recipe.ingredients.forEach(ingredient => {
        const ingredientLower = ingredient.toLowerCase();
        commonAllergens.forEach(allergen => {
            if(ingredientLower.includes(allergen)&&!recipe.allergies.map(a=> a.toLowerCase()).includes(allergen)){
                recipe.allergies.push(allergen);
            }
        });
    });
}
async function callOpenAI(ingredients, title ="") {
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const apiHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer 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`,
    };
    const apiBody = {
        //Fine Tuned model
        model: "ft:gpt-3.5-turbo-0125:personal::BDYdTVdf",
        messages: [
            { role: "system", content: "You are a chef who creates recipes based on a list of ingredients. Please return a JSON object with the following structure: {title, ingredients[], instructions[], macros: {total_fat, sugar, sodium, protein, saturated_fat}, calories, diet, allergies[], cookTime, servings}. Don't leave any field undefined or null." },
            { role: "user",
                content: title
                    ? `Generate a recipe titled "${title}" using these ingredients: ${ingredients}. You can add more ingredients if needed to complete the dish.`
                    : `Generate a recipe using these ingredients: ${ingredients}. You can add more ingredients if needed to complete the dish.`,},
        ],
    };
    const maxRetries = 3; //Max retries
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const data = await fetchFromAPI(apiUrl, "POST", apiHeaders, apiBody);
            const recipeContent = data.choices[0].message.content;

            // Attempt to parse the response into JSON
            let parsedRecipe = JSON.parse(recipeContent);

            //Check if the instructions field is a string
            if (typeof parsedRecipe.instructions === 'string') {
                let trimmed = parsedRecipe.instructions.trim();
                // If it appears to be an array represented as a string, try to convert it
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    try {
                        //Replace single quotes with double quotes
                        parsedRecipe.instructions = JSON.parse(trimmed.replace(/'/g, '"'));
                    } catch (err) {
                        console.error("Failed to parse instructions string as JSON:", err);
                    }
                }
            }

            checkAllergens(parsedRecipe);
            return parsedRecipe;
        } catch (error) {
            console.error("Error parsing or fetching recipe, attempt:", attempt + 1, error);
            attempt++;
            await sleep(1000*attempt);
            if (attempt >= maxRetries) {
                console.error("Max retries reached, failed to get valid JSON.");
                throw new Error("Failed to generate a valid recipe after multiple attempts");
            }
            const delay = Math.pow(2, attempt)*500;
            await sleep(delay);
        }
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function renderRecipe(recipe, index) {

    //really annoying to deal with would be great if we could move this functionality into ejs
    const isMobile = window.innerWidth < 768;
    const recipeText = `
        <div data-id="${index}" class="bg-gray-100 shadow-md rounded-lg relative w-full mx-auto md:mx-0 mb-6 pt-2 pl-2">
            ${isMobile
        ? `<img src="${recipe.image}" alt="Image for ${recipe.title}" class="w-64 h-64 object-cover rounded-lg shadow-md mb-4 ml-4"/>`
        : `<img src="${recipe.image}" alt="Image for ${recipe.title}" class="w-64 h-64 object-cover rounded-lg shadow-md absolute top-2 right-2" />`
    }
            <div class="p-4">
                <h3 class="text-2xl font-bold">${recipe.title}</h3>
                <div class="py-2">
                    <p class="mt-2"><b>Ingredients:</b></p>
                    <ul class="list-disc list-inside text-sm text-gray-600">
                        ${recipe.ingredients.map((ingredient) => `<li>${ingredient}</li>`).join('')}
                    </ul>
                    <p class="mt-2"><b>Instructions:</b></p>
                    <p class="text-sm text-gray-600">${recipe.instructions.join('<br>')}</p>
                    <p class="mt-2"><b>Macronutrients:</b></p>
                    <ul class="list-disc list-inside text-sm text-gray-600">
                        <li>Protein: ${recipe.macros.protein}g</li>
                        <li>total Fat: ${recipe.macros.total_fat}g</li>
                        <li>Saturated Fat: ${recipe.macros.saturated_fat}g</li>
                        <li>Sugar: ${recipe.macros.sugar}g</li>
                        <li>Sodium: ${recipe.macros.sodium}g</li>
                    </ul>
                    <p class="mt-2"><b>Diet:</b> <span class="text-gray-600">${recipe.diet}</span></p>
                    <p class="mt-2"><b>Total Calories:</b> <span class="text-gray-600">${recipe.calories} KCAL</span></p>
                    <p class="mt-2"><b>Allergies:</b> <span class="text-gray-600">${recipe.allergies.join(', ') || 'None'}</span></p>
                    <p class="mt-2"><b>Cook Time:</b> <span class="text-gray-600">${recipe.cookTime || 'Not specified'} minutes</span></p>
                    <form action="generateRecipe/saveRecipe" method="POST" class="mt-4">
                        <input type="hidden" name="recipeName" value="${recipe.title}">
                        <input type="hidden" name="ingredientName" value='${JSON.stringify(recipe.ingredients)}'>
                        <input type="hidden" name="instructions" value='${JSON.stringify(recipe.instructions)}'>
                        <input type="hidden" name="diet" value='${JSON.stringify(recipe.instructions)}'>
                        <input type="hidden" name="allergies" value='${JSON.stringify(recipe.allergies) || "[]"}'>
                        <input type="hidden" name="macros" value='${JSON.stringify(recipe.macros)}'>
                        <input type="hidden" name="calories" value='${JSON.stringify(recipe.calories)}'>
                        <input type="hidden" name="cookingTime" value="${recipe.cookTime || '0'}">
                        <input type="hidden" name="image" value="${recipe.image}">
                        <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full md:w-auto">
                            Save Recipe
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    const recipeDiv = document.createElement("div");
    recipeDiv.innerHTML = recipeText;

    const editButton = document.createElement("button");
    editButton.innerText = "Edit Recipe";
    editButton.className = "edit-button bg-blue-500 text-white px-3 py-1 rounded mt-2 hover:bg-blue-600";
    editButton.addEventListener("click", () => {
        document.getElementById("manual-edit-form").classList.remove("hidden");
        document.getElementById("recipeName").value = recipe.title;
        document.getElementById("ingredientName").value = recipe.ingredients.join(", ");
        document.getElementById("diet").value = recipe.diet || "";
        document.getElementById("allergies").value = recipe.allergies.join(", ") || "";
        document.getElementById("macros").value = `${recipe.macros.protein}g protein, ${recipe.macros.total_fat}g fat`;
        document.getElementById("cookingTime").value = recipe.cookTime || 0;
        document.getElementById("instructions").value = recipe.instructions.join("\n");
        document.getElementById("calories").value = recipe.calories || "";
        document.getElementById("image").value = recipe.image || "";
    });

    recipeDiv.appendChild(editButton);
    return recipeDiv;
}
async function generateRecipe() {

    document.getElementById("loading-indicator").classList.remove("hidden");
    document.getElementById("recipe-gen-text").classList.add("hidden");
    document.getElementById("recipe-text").classList.add("hidden");

    const ingredients= document.getElementById("ingredients-input").value;
    const recipeCount=parseInt(document.getElementById("recipeCount").value, 10);
    const recipeOutput= document.getElementById("recipe-text");

    recipeOutput.innerHTML = "";
    for (let i = 0;i < recipeCount; i++) {
        try {
            const recipe = await callOpenAI(ingredients, title);
            const imageUrl = await generateImage(recipe);
            recipe.image = imageUrl;
            const recipeCard = renderRecipe(recipe, i);
            recipeOutput.appendChild(recipeCard);
        }catch (error){
            console.error("Failed to autofill recipe:", error);
            const errorDiv = document.createElement("div");
            errorDiv.className = "text-red-500 mb-4";
            errorDiv.innerText = "Failed to autofill recipe.";
            recipeOutput.appendChild(errorDiv);
        }
    }
    document.getElementById("loading-indicator").classList.add("hidden");
    document.getElementById("recipe-gen-text").classList.remove("hidden");
    document.getElementById("recipe-text").classList.remove("hidden");

}document.getElementById("autoFillButton").addEventListener("click", async () => {
    const name = document.getElementById("autoRecipeName").value.trim();
    const ingredients = document.getElementById("autoIngredients").value.trim();
    const title = document.getElementById("title-input").value;

    if (!name && !ingredients) {
        alert("Please enter at least a recipe name or some ingredients.");
        return;
    }

    try {
        const recipe = await callOpenAI(ingredients || name);

        document.getElementById("autoDiet").value = recipe.diet || "";
        document.getElementById("autoAllergies").value = (recipe.allergies || []).join(", ");
        document.getElementById("autoMacros").value = recipe.macros
            ? `${recipe.macros.protein}g protein, ${recipe.macros.total_fat}g fat`
            : "";
        document.getElementById("autoCookTime").value = recipe.cookTime || "";
        document.getElementById("autoInstructions").value = (recipe.instructions || []).join("\n");
        document.getElementById("autoCalories").value = recipe.calories || "";
        document.getElementById("autoImage").value = recipe.image || "";
        document.getElementById("autoFilledFields").classList.remove("hidden");

    } catch (error) {
        alert("Failed to auto-fill recipe. Try again.");
        console.error(error);
    }
});




