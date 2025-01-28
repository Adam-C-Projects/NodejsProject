
-- CREATE DATABASE Recipes4U;
-- USE Recipes4U;


-- CREATE TABLE User (
--     UID INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(50) NOT NULL UNIQUE,
--     password_hash VARCHAR(255) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE Recipes (
--     RID INT AUTO_INCREMENT PRIMARY KEY,
--     recipeName VARCHAR(100) NOT NULL,
--     ingredientName TEXT NOT NULL,
--     dietaryReq VARCHAR(50),
--     macros VARCHAR(100),
--     cookingTime INT NOT NULL
-- );

-- CREATE TABLE SavedRecipes (
--     SavedRID INT AUTO_INCREMENT PRIMARY KEY,
--     UID INT NOT NULL,
--     RID INT NOT NULL,
--     saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (UID) REFERENCES User(UID),
--     FOREIGN KEY (RID) REFERENCES Recipes(RID)
-- );

-- -- Step 3: Insert Example Data

-- -- User Registration
-- INSERT INTO User (username, password_hash, email)
-- VALUES ('exampleUser', '$2y$10$abc123hashedpassword', 'example@email.com');

-- -- Adding Recipes
-- INSERT INTO Recipes (recipeName, ingredientName, dietaryReq, macros, cookingTime)
-- VALUES 
-- ('Spaghetti Bolognese', 'spaghetti, ground beef, tomato sauce, garlic, onion, olive oil', 'None', 'Protein: 30g, Carbs: 45g, Fat: 15g', 45),
-- ('Vegan Salad', 'lettuce, cucumber, avocado, olive oil, lemon juice', 'Vegan', 'Protein: 5g, Carbs: 10g, Fat: 20g', 10);

-- -- Saving a Recipe
-- INSERT INTO SavedRecipes (UID, RID)
-- VALUES (1, 1), (1, 2); -- Assuming User 1 saved Recipes 1 and 2.


-- -- Fetch Recipes by Name or Ingredient
-- SELECT * 
-- FROM Recipes 
-- WHERE recipeName LIKE '%spaghetti%' OR ingredientName LIKE '%garlic%';

-- -- Retrieve Saved Recipes for a User
-- SELECT r.recipeName, r.ingredientName, r.dietaryReq, r.cookingTime
-- FROM Recipes r
-- JOIN SavedRecipes sr ON r.RID = sr.RID
-- WHERE sr.UID = 1;

-- -- Delete a Recipe
-- DELETE FROM Recipes
-- WHERE RID = 2;

-- CREATE TABLE RecipeCategories (
--     CategoryID INT AUTO_INCREMENT PRIMARY KEY,
--     CategoryName VARCHAR(50) NOT NULL UNIQUE
-- );
-- -- new catogrised recipes for dinner breakfast and lunch 
-- CREATE TABLE RecipeCategoryMapping (
--     RID INT NOT NULL,
--     CategoryID INT NOT NULL,
--     FOREIGN KEY (RID) REFERENCES Recipes(RID),
--     FOREIGN KEY (CategoryID) REFERENCES RecipeCategories(CategoryID)
-- );
-- --- and favuitred recipes 
-- ALTER TABLE SavedRecipes ADD is_favorite BOOLEAN DEFAULT FALSE;
