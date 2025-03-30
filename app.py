from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

app = Flask(__name__)

# db config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///recipes.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

from models import db, Ingredient, Recipe 

# route that takes the original serving size, new serving size, and ingredients list
@app.route('/')
def home():
    return render_template('index.html')

# route to handle the scaling of ingredients
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
        scaled_amount = float(ing["amount"]) * scale_factor 

        new_ingredient = Ingredient(
            recipe_id=1,  # dummy value, as we don't have a recipe_id here
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

# route that returns the recipe details along with its ingredients
@app.route('/save_recipe', methods=['POST'])
def save_recipe():
    data = request.get_json()
    recipe_name = data.get('name')
    servings = data.get('servings')
    ingredients_data = data.get('ingredients', [])

    # validate incoming data
    if not recipe_name or not servings or not ingredients_data:
        return jsonify({'error': 'Missing recipe name, servings, or ingredients'}), 400

    # create and save Recipe
    new_recipe = Recipe(name=recipe_name, servings=int(servings))
    db.session.add(new_recipe)
    db.session.commit()  # Get new_recipe.id

    # save ingredients
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

# route to show all saved recipes
@app.route('/recipes')
def recipes():
    all_recipes = Recipe.query.all()
    return render_template('recipes.html', recipes=all_recipes)

if __name__ == '__main__':
    app.run(debug=True)

# route to get a specific recipe by id
@app.route('/get_recipe/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    recipe = Recipe.query.get_or_404(recipe_id)
    ingredients = Ingredient.query.filter_by(recipe_id=recipe.id).all()

    ingredients_list = [
        {"name": ing.name, "amount": ing.amount, "unit": ing.unit}
        for ing in ingredients
    ]
    # returns the recipe details along with its ingredients
    return jsonify({
        "name": recipe.name,
        "servings": recipe.servings,
        "ingredients": ingredients_list
    })

# delete a recipe by id
@app.route('/delete_recipe/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    recipe = Recipe.query.get(recipe_id)
    
    if not recipe:
        return jsonify({"message": "Recipe not found"}), 404

    try:
        # Delete all associated ingredients first
        Ingredient.query.filter_by(recipe_id=recipe_id).delete()
        
        # Delete the recipe
        db.session.delete(recipe)
        db.session.commit()

        return jsonify({"message": "Recipe deleted successfully"})
    
    except Exception as e:
        db.session.rollback()  # Rollback if something goes wrong
        return jsonify({"message": "Error deleting recipe", "error": str(e)}), 500

# update a recipe 
@app.route('/update_recipe/<int:recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    data = request.get_json()
    recipe = Recipe.query.get(recipe_id)

    if not recipe:
        return jsonify({'error': 'Recipe not found'}), 404

    recipe.name = data['name']
    recipe.servings = int(data['original_serving'])

    # Clear old ingredients and add new ones
    Ingredient.query.filter_by(recipe_id=recipe_id).delete()
    for ing in data['ingredients']:
        new_ing = Ingredient(
            recipe_id=recipe.id,
            name=ing['name'],
            amount=float(ing['amount']),
            unit=ing['unit']
        )
        db.session.add(new_ing)

    db.session.commit()
    return jsonify({'message': 'Recipe updated successfully!'})
