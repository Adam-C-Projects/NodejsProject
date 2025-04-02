//Import required modules
const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');

//Import route handlers
const loginRouter = require('./routes/loginRoutes');
const registerRouter = require('./routes/registerRoutes');
const savedRecipeRouter = require('./routes/savedRecipeRoutes');
const allRecipesRouter = require('./routes/allRecipesRoutes');
const createRecipesRouter = require('./routes/createRecipesRoutes');
const generateRecipeRouter = require('./routes/generateRecipeRoutes');
const profileRouter = require('./routes/profileRoutes');
const macroTrackerRouter = require('./routes/macroTrackerRoutes');

const app = express();
const PORT = 3045;

//Middleware to serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

//Parse cookies
app.use(cookieParser("test"));

//Set up session handling
app.use(session({
    secret: "test session",
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 900000 * 60, //Cookie expiration time
        signed: true,
    },
}));

//Middleware to parse form data and JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Middleware to detect if request was made from a mobile device
app.use((req, res, next) => {
    const ua = req.headers['user-agent'];
    // This simple regex test checks if the user agent string contains 'mobile'
    res.locals.isMobile = /Mobi|Android|iPhone|iPad|iPod|Kindle|Silk/i.test(ua);
    next();
  });

//Make uploaded images accessible via /uploads URL
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


// Set the view engine to EJS and define views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Create a connection to the MYSQL database
const db = mysql.createConnection({
    host: 'dragon.kent.ac.uk',
    user: 'asc50',
    password: '3ydonef',
    database: "asc50"
});

// Open the MySQL connection and start the server
db.connect(error => {
    if (error) {
        console.log("An error has occurred while connecting to the database.");
        throw error;
    }

    app.listen(PORT, '', () => {
        console.log("Database connection is ready and server is listening on port", PORT);
    });
});

//Register routes for different feature endpoints
app.use('/login', loginRouter(db));
app.use('/register', registerRouter(db));
app.use('/savedRecipes', savedRecipeRouter(db));
app.use('/allRecipes', allRecipesRouter(db));
app.use('/createRecipes',createRecipesRouter(db));
app.use('/recommendation', require('./routes/recommendationRoutes')(db));
app.use('/generateRecipe',generateRecipeRouter(db));
app.use('/userProfile', profileRouter(db));
app.use('/macroTracker' , macroTrackerRouter(db));

//DEfault route to sender main page
app.get('/', (req, res) => {
    const username = req.session.username;

    res.render('mainPage', {username});
    console.log(req.session);
    console.log(req.session.id);
    req.session.visited = true;
    //
});

