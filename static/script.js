// add ingredient button 
function addIngredient() {
    let container = document.getElementById('ingredients_list');
    let div = document.createElement('div');
    div.classList.add('ingredient');

    // HTML for the ingredient div
    div.innerHTML = 
        `
        <button class="trash" onclick="deleteIngredient(event)"><i class="fa fa-trash"></i></button>
        <input type="text" class="name" placeholder="Ingredient">
        <input type="number" class="amount" placeholder="Amount">
        <select class="unit">
            <option>ml</option>
            <option>L</option>
            <option>fl oz</option>
            <option>g</option>
            <option>kg</option>
            <option>oz</option>
            <option>cup</option>
            <option>tbsp</option>
            <option>tsp</option>
            <option>piece</option>
        </select>
        `;
    // adds the new ingredient div to the container
    container.appendChild(div);
}


// function to delete an ingredient when the trash icon is clicked
function deleteIngredient(event) {
    let ingredientDiv = event.target.closest('.ingredient');
    ingredientDiv.remove();
    console.log("Deleted");
}

function saveRecipe() {
    let ingredientDivs = document.querySelectorAll('#ingredients_list .ingredient');
    let ingredients = [];

    ingredientDivs.forEach(div => {
        let name = div.querySelector('.name').value;
        let amount = div.querySelector('.amount').value;
        let unit = div.querySelector('.unit').value;

        if (name && amount) {
            ingredients.push({ name, amount, unit });
        }
    });

    let recipeName = document.getElementById('RecipeName').value;
    let servings = document.getElementById('original_serving').value;
    
    // check if the recipe name and servings are filled
    if (!recipeName || !servings || ingredients.length === 0) {
        alert("Please fill out the recipe name, servings, and at least one ingredient.");
        return;
    }

    // check if the servings is a number
    fetch('/save_recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: recipeName,
            servings: servings,
            ingredients: ingredients
        })
    })
    .then(response => response.json())
    .then(data => {
        alert("Recipe saved successfully!");
        console.log(data);
    })
    .catch(error => {
        console.error('Error saving recipe:', error);
        alert("There was an error saving the recipe.");
    });
}

// function to print the scaled ingredients
function printIngredients() {
    let content = document.getElementById("scaled_ingredients_list").innerHTML;
    
    if (!content.trim()) {
        alert("There are no scaled ingredients to print!");
        return;
    }

    let printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Scaled Ingredients</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h2 { text-align: center; }
                .ingredient-list { margin-top: 20px; }
            </style>
        </head>
        <body>
            <h2>Scaled Ingredients</h2>
            <div class="ingredient-list">${content}</div>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() { window.close(); };
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// function to dalete a saved recipe
function deleteRecipe() {
            let recipeId = document.getElementById("deleteRecipeBtn").getAttribute("data-id");
            if (!recipeId) return;

            if (!confirm("Are you sure you want to delete this recipe?")) return;

            fetch(`/delete_recipe/${recipeId}`, { method: "DELETE" })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                location.reload(); // Reload to update dropdown and clear fields
            })
            .catch(error => console.error("Error deleting recipe:", error));
        }   

// Unified scaleRecipe function
function scaleRecipe() {
    const originalServing = parseFloat(document.getElementById("original_serving").value);
    const newServing = parseFloat(document.getElementById("new_serving").value);
    
    if (!originalServing || !newServing || newServing <= 0) {
        alert("Please enter valid serving sizes.");
        return;
    }

    const scaleFactor = newServing / originalServing;
    const outputDiv = document.getElementById("scaled_ingredients_list");
    outputDiv.innerHTML = "";

    // Check which page we're on by looking for input fields
    const isMainPage = document.querySelector("#ingredients_list .ingredient .name") !== null;

    if (isMainPage) {
        // Handle main page (index.html) - user inputted ingredients
        const ingredients = [];
        document.querySelectorAll("#ingredients_list .ingredient").forEach(div => {
            const name = div.querySelector(".name").value;
            const amount = div.querySelector(".amount").value;
            const unit = div.querySelector(".unit").value;

            if (name.trim() && amount) {
                ingredients.push({ name, amount, unit });
            }
        });

        if (ingredients.length === 0) {
            alert("Please add some ingredients first!");
            return;
        }

        // Create styled list for scaled ingredients
        const ul = document.createElement("ul");
        ul.style.listStyleType = "none";
        ul.style.padding = "0";

        ingredients.forEach(ing => {
            const scaledAmount = parseFloat(ing.amount) * scaleFactor;
            
            const li = document.createElement("li");
            li.style.marginBottom = "8px";
            
            const scaledText = document.createElement("span");
            scaledText.textContent = `${scaledAmount.toFixed(2)} ${ing.unit} ${ing.name}`;
            
            const separator = document.createElement("hr");
            separator.style.margin = "8px 0";
            separator.style.opacity = "0.2";
            
            li.appendChild(scaledText);
            li.appendChild(separator);
            ul.appendChild(li);
        });

        outputDiv.appendChild(ul);
    } else {
        // Handle recipes page (recipes.html) - database ingredients
        const ingredientElements = document.querySelectorAll("#ingredients_list li");
        if (ingredientElements.length === 0) {
            alert("No ingredients found to scale!");
            return;
        }

        const ul = document.createElement("ul");
        ul.style.listStyleType = "none";
        ul.style.padding = "0";

        ingredientElements.forEach(li => {
            const textElement = li.querySelector("span");
            if (!textElement) return;
            
            const text = textElement.textContent.trim();
            const parts = text.split(/\s+/);
            const amount = parseFloat(parts[0]);
            
            if (isNaN(amount)) {
                // For non-numeric amounts
                const newLi = document.createElement("li");
                newLi.innerHTML = li.innerHTML;
                ul.appendChild(newLi);
                return;
            }
            
            const unit = parts[1];
            const name = parts.slice(2).join(" ");
            const scaledAmount = amount * scaleFactor;
            
            const newLi = document.createElement("li");
            newLi.style.marginBottom = "8px";
            
            const scaledText = document.createElement("span");
            scaledText.textContent = `${scaledAmount.toFixed(2)} ${unit} ${name}`;
            
            const separator = document.createElement("hr");
            separator.style.margin = "8px 0";
            separator.style.opacity = "0.2";
            
            newLi.appendChild(scaledText);
            newLi.appendChild(separator);
            ul.appendChild(newLi);
        });

        outputDiv.appendChild(ul);
    }
}

    // Display scaled ingredients
    const outputDiv = document.getElementById("scaled_ingredients_list");
    outputDiv.innerHTML = "";
    scaledIngredients.forEach(ing => {
        const div = document.createElement("div");
        div.textContent = `${ing.name}: ${ing.amount.toFixed(2)} ${ing.unit}`;
        outputDiv.appendChild(div);
    });

// Modified loadRecipe function
function loadRecipe(recipeId) {
    if (!recipeId) return;

    fetch(`/get_recipe/${recipeId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("RecipeName").value = data.name;
            document.getElementById("original_serving").value = data.servings;

            const ingredientsList = document.getElementById("ingredients_list");
            ingredientsList.innerHTML = "";

            // Create a clean unordered list
            const ul = document.createElement("ul");
            ul.style.listStyleType = "none";  // Remove bullets
            ul.style.padding = "0";

            data.ingredients.forEach(ingredient => {
                const li = document.createElement("li");
                li.style.marginBottom = "8px";  // Add spacing between items
                
                // Create ingredient text with amount and unit
                const ingredientText = document.createElement("span");
                ingredientText.textContent = `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`;
                
                // Add a subtle separator
                const separator = document.createElement("hr");
                separator.style.margin = "8px 0";
                separator.style.opacity = "0.2";
                
                li.appendChild(ingredientText);
                li.appendChild(separator);
                ul.appendChild(li);
            });

            ingredientsList.appendChild(ul);

            // Show delete button
            document.getElementById("deleteRecipeBtn").style.display = "block";
            document.getElementById("deleteRecipeBtn").setAttribute("data-id", recipeId);
        })
        .catch(error => console.error("Error loading recipe:", error));
}

// Run when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Attach event listeners for the recipes page
    const recipeDropdown = document.getElementById('saved_recipes');
    if (recipeDropdown) {
        recipeDropdown.addEventListener('change', function() {
            loadRecipe(this.value);
        });
    }

    // Attach scale button (works for both pages)
    const scaleButton = document.querySelector('button[onclick="scaleRecipe()"]');
    if (scaleButton) {
        scaleButton.removeAttribute('onclick');
        scaleButton.addEventListener('click', scaleRecipe);
    }

    // Attach delete button if it exists
    const deleteButton = document.getElementById('deleteRecipeBtn');
    if (deleteButton) {
        deleteButton.addEventListener('click', deleteRecipe);
    }
});