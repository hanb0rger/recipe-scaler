from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Database Configuration (SQLite for simplicity)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///recipes.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class Recipe(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    servings = db.Column(db.Integer, nullable=False)

class Ingredient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipe.id'), nullable=False)  # Correct foreign key reference
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)

    recipe = db.relationship('Recipe', backref=db.backref('ingredients', lazy=True))


with app.app_context():
    db.create_all()
