const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const loginRouter = require('./routes/loginRoutes');
const registerRouter = require('./routes/registerRoutes');
const savedRecipeRouter = require('./routes/savedRecipeRoutes');
const allRecipesRouter = require('./routes/allRecipesRoutes');
const createRecipesRouter = require('./routes/createRecipesRoutes');


const app = express();
const PORT = 3000;

// Set up middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser("test"));
app.use(session({
    secret: "test session",
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 6000 * 60,
        signed: true,
    },
}));
app.use(express.urlencoded({ extended: true }));

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create a connection to the database
const db = mysql.createConnection({
    host: 'dragon.kent.ac.uk',
    user: 'asc50',
    password: '3ydonef',
    database: "asc50"
});

// Open the MySQL connection
db.connect(error => {
    if (error) {
        console.log("An error has occurred while connecting to the database.");
        throw error;
    }

    app.listen(PORT, () => {
        console.log("Database connection is ready and server is listening on port", PORT);
    });
});

// Use routers for specific routes
app.use('/login', loginRouter(db));
app.use('/register', registerRouter(db));
app.use('/savedRecipes', savedRecipeRouter(db));
app.use('/allRecipes', allRecipesRouter);
app.use('/createRecipes',createRecipesRouter(db));

// Main routes
app.get('/', (req, res) => {
    res.render('mainPage');
    console.log(req.session);
    console.log(req.session.id);
    req.session.visited = true;
});

app.post('/saveRecipe', (req, res) => {
    const recipe = req.body;
    const UID = req.session.UID; 
    console.log('Incoming request body:', req.body)

    if (!UID) {
        return res.status(401).send("Unauthorized: No user logged in.");
    }

    if(recipe.dietaryReq = []){
        recipe.dietaryReq = "None"
    }

    const trimBrackets = (value) => {
        if (typeof value === 'string') {
            return value.replace(/[\[\]{}]/g, '').trim();
        }
        return value;
    };

    recipe.recipeName = trimBrackets(recipe.recipeName);
    recipe.ingredientName = trimBrackets(recipe.ingredientName);
    recipe.dietaryReq = recipe.dietaryReq && recipe.dietaryReq.length ? trimBrackets(recipe.dietaryReq) : "None";
    recipe.macros = trimBrackets(recipe.macros);
    recipe.cookingTime = trimBrackets(recipe.cookingTime);

    const insertRecipeQuery = `
        INSERT INTO Recipes (recipeName, ingredientName, dietaryReq, macros, cookingTime)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE RID = LAST_INSERT_ID(RID)
    `;
    const recipeValues = [
        recipe.recipeName,
        recipe.ingredientName,
        recipe.dietaryReq,
        recipe.macros,
        recipe.cookingTime,
    ];

    db.query(insertRecipeQuery, recipeValues, (recipeError, recipeResults) => {
        if (recipeError) {
            console.error('Error saving recipe:', recipeError);
            return res.status(500).send("Failed to save recipe.");
        }

        const RID = recipeResults.insertId;

        const saveRecipeQuery = `
            INSERT INTO SavedRecipes (UID, RID, saved_at)
            VALUES (?, ?, NOW())
        `;
        const saveRecipeValues = [UID, RID];

        db.query(saveRecipeQuery, saveRecipeValues, (saveError) => {
            if (saveError) {
                console.error('Error saving recipe to SavedRecipes:', saveError);
                return res.status(500).send("Failed to save recipe.");
            }

            res.redirect('/');
        });
    });
});

