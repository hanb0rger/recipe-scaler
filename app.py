from flask import Flask, render_template, request, jsonify
from flask_migrate import Migrate

from models import db, Ingredient, app  # Ensure correct imports

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/scale', methods=['POST'])
def scale():
    data = request.json
    original_serving = int(data["original_serving"])
    new_serving = int(data["new_serving"])
    ingredients = data["ingredients"]

    # Calculate scale factor
    scale_factor = new_serving / original_serving if original_serving else 1

    # Clear previous ingredients (optional)
    Ingredient.query.delete()
    db.session.commit()

    scaled_ingredients = []
    for ing in ingredients:
        scaled_amount = float(ing["amount"]) * scale_factor  # Scale the ingredient

        new_ingredient = Ingredient(
            recipe_id=1,  # Static recipe ID for now, modify as needed
            name=ing["name"],
            amount=scaled_amount,
            unit=ing["unit"]
        )

        db.session.add(new_ingredient)
        scaled_ingredients.append({
            "name": ing["name"],
            "amount": scaled_amount,
            "unit": ing["unit"]
        })

    db.session.commit()

    return jsonify({"scaled_ingredients": scaled_ingredients})

if __name__ == '__main__':
    app.run(debug=True)