from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)

# Database Configuration (SQLite for simplicity)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///recipes.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

from models import db, Ingredient, Recipe # Ensure correct imports

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/scale', methods=['POST'])
def scale():
    data = request.json
    print(data)
    original_serving = int(data["original_serving"])
    new_serving = int(data["new_serving"])
    ingredients = data["ingredients"]

    # Calculate scale factor
    scale_factor = new_serving / original_serving if original_serving else 1

    scaled_ingredients = []
    for ing in ingredients:
        scaled_amount = float(ing["amount"]) * scale_factor  # Scale the ingredient

        new_ingredient = Ingredient(
            recipe_id=1,  # Static recipe ID for now, modify as needed
            name=ing["name"],
            amount=scaled_amount,
            unit=ing["unit"]
        )

        scaled_ingredients.append({
            "name": ing["name"],
            "amount": scaled_amount,
            "unit": ing["unit"]
        })


    return jsonify({"scaled_ingredients": scaled_ingredients})

@app.route('/save_recipe', methods=['POST'])
def save_recipe():
    data = request.get_json()
    recipe_name = data.get('name')
    servings = data.get('servings')
    ingredients_data = data.get('ingredients', [])

    # Validate incoming data
    if not recipe_name or not servings or not ingredients_data:
        return jsonify({'error': 'Missing recipe name, servings, or ingredients'}), 400

    # Create and save Recipe
    new_recipe = Recipe(name=recipe_name, servings=int(servings))
    db.session.add(new_recipe)
    db.session.commit()  # Get new_recipe.id

    # Save Ingredients
    for ing in ingredients_data:
        new_ingredient = Ingredient(
            recipe_id=new_recipe.id,
            name=ing['name'],
            amount=float(ing['amount']),
            unit=ing['unit']
        )
        db.session.add(new_ingredient)

    db.session.commit()

    return jsonify({'message': 'Recipe saved successfully!', 'recipe_id': new_recipe.id})

# Route to show all saved recipes
@app.route('/recipes')
def recipes():
    all_recipes = Recipe.query.all()
    return render_template('recipes.html', recipes=all_recipes)

# Route to show a specific recipe by ID
@app.route('/recipe/<int:recipe_id>')
def recipe_detail(recipe_id):
    recipe = Recipe.query.get_or_404(recipe_id)
    return render_template('recipe_detail.html', recipe=recipe)

if __name__ == '__main__':
    app.run(debug=True)