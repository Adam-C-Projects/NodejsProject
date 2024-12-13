document.getElementById("enter-button").addEventListener("click", generateRecipe);

async function callOpenAI(ingredients) {
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer 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`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a chef who generates recipes based on a list of ingredients provided. Please return the recipe in JSON format, including the title, ingredients, instructions, macros (protein, carbs, fat, fiber, sugar, sodium), total calories, allergies, prep time, cook time and servings." },
                    {
                        role: "user",
                        content: `Generate a recipe for the following ingredients: ${ingredients}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch recipe: ${response.status}`);
        }

        const data = await response.json();
        console.log("API output:", data);

        const recipeContent = data.choices[0].message.content;
        const recipe = JSON.parse(recipeContent);
        console.log("Parsed recipe:", recipe);

        console.log("Ingredients:", recipe.ingredients);

        return recipe;

    } catch (error) {
        console.error("Error fetching recipe:", error);
        throw error;
    }
}

async function generateRecipe() {
    const ingredients = document.getElementById("ingredients-input").value;
    const recipeOutput = document.getElementById("recipe-text");

    if (!ingredients.trim()) {
        recipeOutput.innerHTML = "Add ingredients";
        return;
    }

    try {
        const recipe = await callOpenAI(ingredients);
        if(recipe) {
            let recipeText = `Recipe for: ${recipe.title}\n\n`;
            recipeText += `Ingredients:\n${recipe.ingredients.join("\n")}\n\n`;
            recipeText += `Instructions:\n${recipe.instructions.join("\n")}\n\n`;
            recipeText += `Macronutrients:\n`;
            recipeText += `Protein: ${recipe.macros.protein}\n`;
            recipeText += `Carbs: ${recipe.macros.carbs}\n`;
            recipeText += `Fat: ${recipe.macros.fat}\n`;
            recipeText += `Fiber: ${recipe.macros.fiber}\n`;
            recipeText += `Sugar: ${recipe.macros.sugar}\n`;
            recipeText += `Sodium: ${recipe.macros.sodium}\n\n`;
            recipeText += `Total Calories: ${recipe.total_calories}\n`;
            recipeText += `Allergies: ${recipe.allergies.join(", ")}`;
            recipeText += `\nPrep time: ${recipe.prepTime}\n`;
            recipeText += `Cook time: ${recipe.cookTime}\n`;
            recipeText += `Servings: ${recipe.servings}\n\n`;

            recipeOutput.innerText = recipeText;
        }

    } catch (error) {
        recipeOutput.innerHTML = `Error: ${error.message}`;
    }
}

