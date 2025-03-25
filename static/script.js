function addIngredient() {
    let container = document.getElementById('ingredients_list');
    let div = document.createElement('div');
    div.classList.add('ingredient');
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
        </select>`;
    container.appendChild(div);
}

function deleteIngredient(event) {
    let ingredientDiv = event.target.closest('.ingredient');
    ingredientDiv.remove();
    console.log("Deleted");
}

function scaleRecipe() {
    let original_serving = document.getElementById("original_serving").value;
    let new_serving = document.getElementById("new_serving").value;

    let ingredients = [];
    document.querySelectorAll("#ingredients_list .ingredient").forEach(div => {
        let name = div.querySelector(".name").value;
        let amount = div.querySelector(".amount").value;
        let unit = div.querySelector(".unit").value;

        if (name.trim() && amount) {
            ingredients.push({ name, amount, unit });
        }
    });

    fetch("/scale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_serving, new_serving, ingredients })
    })
    .then(response => response.json())
    .then(data => {
        let output = document.getElementById("scaled_ingredients_list");
        output.innerHTML = "";  // Clear previous content
        data.scaled_ingredients.forEach(ingredient => {
            let div = document.createElement("div");
            div.innerHTML = `class="" ${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`;
            output.appendChild(div);
        });
    })
    .catch(error => console.error("Error:", error));
}
