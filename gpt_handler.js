document.getElementById("enter-button").addEventListener("click", generateRecipe);

async function generateRecipe() {
    const ingredients = document.getElementById("ingredients-input").value;
    const recipeOutput = document.getElementById("recipe-text");

    if (!ingredients.trim()) {
        recipeOutput.innerHTML = "Add ingredients";
        return;
    }

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
                    {
                        role: "system",
                        content: "You are a chef who generates recipes based on a list of ingredients provided."
                    },
                    {
                        role: "user",
                        content: `Create a recipe using the following ingredients: ${ingredients}. Please also provide the macros (protein, carbs, fat) and the total calories for the recipe and any allergies.`
                    }
                ]
            })
        });

        const data = await response.json();
        if (response.ok) {
            const recipe = data.choices[0].message.content;
            recipeOutput.innerHTML = `<pre>${recipe}</pre>`;

            const tempTitle = recipe.match(/Recipe: (.*)/);
            const tempIngredients = recipe.match(/Ingredients:([\s\S]*?)Instructions:/);
            const tempInstructions = recipe.match(/Instructions:([\s\S]*)/);
            const tempMacros = recipe.match(/Macros:\n([\s\S]*?)\n\n/);
            const tempAllergies = recipe.match(/Allergies:\n([\s\S]*)/);

            if (tempTitle && tempIngredients && tempInstructions) {
                const title = tempTitle[1].trim();
                const ingredients = tempIngredients[1].trim();
                const instructions = tempInstructions[1].trim();
                const macros = tempMacros[1].trim();
                const allergies = tempAllergies[1].trim();

                await fetch('/createRecipes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title,
                        ingredients,
                        instructions
                    })
                });
            }
        } else {
            recipeOutput.innerHTML = `Error: ${data.error.message}`;
        }
    } catch (error) {
        recipeOutput.innerHTML = `Error: ${error.message}`;
    }
}
