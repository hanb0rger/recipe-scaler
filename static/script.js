
function addIngredient() {
    // Get the container element for ingredients
    let container = document.getElementById('ingredients_list');
    // Create new div element for this ingredient
    let div = document.createElement('div');
    div.classList.add('ingredient');

    // Build the HTML structure for the ingredient row
    div.innerHTML = 
        `
        <button class="trash" onclick="deleteIngredient(event)"><i class="fa fa-trash"></i></button>
        <input type="text" class="name" placeholder="Ingredient">
        <input type="number" class="amount" placeholder="Amount">
        <select class="unit">
            <option>ml</option>
            <option>L</option>
            <option>fl oz</option>
            <option>lb</option>
            <option>g</option>
            <option>kg</option>
            <option>oz</option>
            <option>cups</option>
            <option>tbsp</option>
            <option>tsp</option>
            <option>pieces</option>
        </select>
        
        `;
    // Append the new ingredient row to the container
    container.appendChild(div);
}

/**
 * Removes an ingredient row when its trash icon is clicked
 * @param {Event} event - The click event from the trash button
 */
function deleteIngredient(event) {
    // Find the closest parent ingredient div
    let ingredientDiv = event.target.closest('.ingredient');
    // Remove the ingredient from DOM
    ingredientDiv.remove();
    console.log("Deleted ingredient");
}

/**
 * Saves the current recipe to the database
 * Collects all ingredients, validates inputs, and sends to server
 */
function saveRecipe() {
    // Get all ingredient divs from the list
    let ingredientDivs = document.querySelectorAll('#ingredients_list .ingredient');
    let ingredients = [];

    // Extract values from each ingredient input
    ingredientDivs.forEach(div => {
        let name = div.querySelector('.name').value;
        let amount = div.querySelector('.amount').value;
        let unit = div.querySelector('.unit').value;

        // Only include ingredients with both name and amount
        if (name && amount) {
            ingredients.push({ name, amount, unit });
        }
    });

    // Get recipe metadata
    let recipeName = document.getElementById('RecipeName').value;
    let servings = document.getElementById('original_serving').value;
    
    // Validate required fields are filled
    if (!recipeName || !servings || ingredients.length === 0) {
        alert("Please fill out the recipe name, servings, and at least one ingredient.");
        return;
    }

    // Send recipe data to server
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
        console.log("Save response:", data);
    })
    .catch(error => {
        console.error('Error saving recipe:', error);
        alert("There was an error saving the recipe.");
    });
}

/**
 * Opens a print-friendly window with the scaled ingredients
 */
function printIngredients() {
    const newServing = document.getElementById("new_serving").value;
    const recipeName = document.getElementById("RecipeName").value;
    
    // Get the container and check for LI elements
    const scaledList = document.getElementById("scaled_ingredients_list");
    const ingredients = scaledList.querySelectorAll("li");
    
    if (ingredients.length === 0) {
        alert("There are no scaled ingredients to print! Please scale the recipe first.");
        return;
    }

    // Create bullet-point content
    const bulletContent = Array.from(ingredients).map(li => {
        // Clone the LI to preserve its content and styling
        const clonedLi = li.cloneNode(true);
        // Add our square bullet before the content
        clonedLi.innerHTML = `
            <span style="display:inline-block; width:12px; height:12px; border:2px solid #4CAF50; margin-right:10px;"></span>
            ${clonedLi.innerHTML}
        `;
        return clonedLi.outerHTML;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>${recipeName || 'Scaled Recipe'}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
                
                body {
                    font-family: 'Poppins', sans-serif;
                    padding: 30px;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .recipe-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .serving-info {
                    font-size: 16px;
                    margin: 15px 0;
                    background: #f8f9fa;
                    padding: 8px 15px;
                    border-radius: 20px;
                    display: inline-block;
                }
                .ingredient-list {
                    margin-top: 25px;
                    padding-left: 0;
                    list-style: none;
                }
                .ingredient-list li {
                    padding: 10px 0;
                    border-bottom: 1px dashed #eee;
                    display: flex;
                    align-items: center;
                }
                @media print {
                    body {
                        padding: 15mm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="recipe-title">${recipeName || 'Scaled Recipe'}</div>
                <div class="serving-info">Servings: ${newServing}</div>
            </div>
            
            <ul class="ingredient-list">
                ${bulletContent}
            </ul>
            
            <div style="text-align: center; margin-top: 40px; color: #aaa;">
                Printed from ScaleMyRecipe
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 300);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

/**
 * Deletes a saved recipe after confirmation
 */
function deleteRecipe() {
    let recipeId = document.getElementById("deleteRecipeBtn").getAttribute("data-id");
    if (!recipeId) return;

    // Confirm deletion with user
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    // Send delete request to server
    fetch(`/delete_recipe/${recipeId}`, { method: "DELETE" })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        location.reload(); // Refresh to update UI
    })
    .catch(error => console.error("Error deleting recipe:", error));
}   

/**
 * Scales recipe ingredients based on serving size changes
 * Handles both newly inputted and saved recipes
 */
function scaleRecipe() {
    // Get serving sizes from inputs
    const originalServing = parseFloat(document.getElementById("original_serving").value);
    const newServing = parseFloat(document.getElementById("new_serving").value);
    
    // Validate inputs
    if (!originalServing || !newServing || newServing <= 0) {
        alert("Please enter valid serving sizes.");
        return;
    }

    // Calculate scaling factor
    const scaleFactor = newServing / originalServing;
    const outputDiv = document.getElementById("scaled_ingredients_list");
    outputDiv.innerHTML = "";

    // Determine if we're on main page or recipes page
    const isMainPage = document.querySelector("#ingredients_list .ingredient .name") !== null;

    if (isMainPage) {
        // Handle newly inputted ingredients
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

        // Scale each ingredient and add to list
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
        // Handle saved recipes from database
        const ingredientElements = document.querySelectorAll("#ingredients_list li");
        if (ingredientElements.length === 0) {
            alert("No ingredients found to scale!");
            return;
        }

        const ul = document.createElement("ul");
        ul.style.listStyleType = "none";
        ul.style.padding = "0";

        // Process each saved ingredient
        ingredientElements.forEach(li => {
            const textElement = li.querySelector("span");
            if (!textElement) return;
            
            // Parse ingredient text into components
            const text = textElement.textContent.trim();
            const parts = text.split(/\s+/);
            const amount = parseFloat(parts[0]);
            
            if (isNaN(amount)) {
                // Handle non-numeric amounts (like "to taste")
                const newLi = document.createElement("li");
                newLi.innerHTML = li.innerHTML;
                ul.appendChild(newLi);
                return;
            }
            
            const unit = parts[1];
            const name = parts.slice(2).join(" ");
            const scaledAmount = amount * scaleFactor;
            
            // Create scaled ingredient display
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

/**
 * Loads a saved recipe from the database
@param {number} recipeId - ID of the recipe to load
 */
function loadRecipe(recipeId) {
    if (!recipeId) return;

    // Fetch recipe data from server
    fetch(`/get_recipe/${recipeId}`)
        .then(response => response.json())
        .then(data => {
            // Update recipe header info
            document.getElementById("RecipeName").value = data.name;
            document.getElementById("original_serving").value = data.servings;

            const ingredientsList = document.getElementById("ingredients_list");
            ingredientsList.innerHTML = "";

            // Create clean list structure
            const ul = document.createElement("ul");
            ul.style.listStyleType = "none";
            ul.style.padding = "0";

            // Add each ingredient to the list
            data.ingredients.forEach(ingredient => {
                const li = document.createElement("li");
                li.style.marginBottom = "8px";
                
                // Create text display for ingredient
                const ingredientText = document.createElement("span");
                ingredientText.textContent = `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`;
                
                // Add visual separator
                const separator = document.createElement("hr");
                separator.style.margin = "8px 0";
                separator.style.opacity = "0.2";
                
                li.appendChild(ingredientText);
                li.appendChild(separator);
                ul.appendChild(li);
            });

            ingredientsList.appendChild(ul);

            // Enable delete button for this recipe
            document.getElementById("deleteRecipeBtn").style.display = "block";
            document.getElementById("deleteRecipeBtn").setAttribute("data-id", recipeId);
        })
        .catch(error => console.error("Error loading recipe:", error));
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up recipe dropdown change listener
    const recipeDropdown = document.getElementById('saved_recipes');
    if (recipeDropdown) {
        recipeDropdown.addEventListener('change', function() {
            loadRecipe(this.value);
        });
    }

    // Replace inline onclick with proper event listener
    const scaleButton = document.querySelector('button[onclick="scaleRecipe()"]');
    if (scaleButton) {
        scaleButton.removeAttribute('onclick');
        scaleButton.addEventListener('click', scaleRecipe);
    }

    // Set up delete button if present
    const deleteButton = document.getElementById('deleteRecipeBtn');
    if (deleteButton) {
        deleteButton.addEventListener('click', deleteRecipe);
    }
});