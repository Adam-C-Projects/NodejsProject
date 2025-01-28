-- List all tables
SHOW TABLES;

-- View the first few rows of the `User` table
SELECT * FROM User LIMIT 10;

-- Check a user's saved recipes
SELECT r.*
FROM SavedRecipes sr
JOIN Recipes r ON sr.RID = r.RID
JOIN User u ON sr.UID = u.UID
WHERE u.username = 'some_username';
