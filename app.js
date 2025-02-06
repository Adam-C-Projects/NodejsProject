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
const recommendationRoutes = require('./routes/recommendationRoutes');
const generateRecipeRouter = require('./routes/generateRecipeRoutes');

const app = express();
const PORT = 3001;

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
app.use('/recommendation', recommendationRoutes());
app.use('/generateRecipe',generateRecipeRouter(db));
// Main routes

app.get('/', (req, res) => {
    res.render('mainPage');
    console.log(req.session);
    console.log(req.session.id);
    req.session.visited = true;
});
app.get('/allRecipes', (req, res) => {
    const query = 'SELECT * FROM Recipes';

    db.query(query, (err, results) => {
        if (err) {
            console.error("An error occurred while fetching data:", err);
            res.status(500).send("Error fetching data from the database.");
            return;
        }
        console.log("Query results:", results);

        
        results.forEach(recipe => {
            if (recipe.macros) {
                recipe.macros = recipe.macros
                .replace(/"/g, '')
                .split(',')
                .map(macro => macro.trim());
            }
        });

        results.forEach(recipe => {
            if (recipe.ingredientName) {
                recipe.ingredientName = recipe.ingredientName
                .replace(/"/g, '')
                .split(',')
                .map(ingredientName => ingredientName.trim());
            }
        });
        res.render('allRecipes', { recipes: results });
    });
});

