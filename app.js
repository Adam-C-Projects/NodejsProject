    const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
// const multer = require('multer');
const loginRouter = require('./routes/loginRoutes');
const registerRouter = require('./routes/registerRoutes');
const savedRecipeRouter = require('./routes/savedRecipeRoutes');
const allRecipesRouter = require('./routes/allRecipesRoutes');
const createRecipesRouter = require('./routes/createRecipesRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const generateRecipeRouter = require('./routes/generateRecipeRoutes');
const profileRouter = require('./routes/profileRoutes');

const app = express();
const PORT = 3015;

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
app.use(express.json());
//check if mobile
app.use((req, res, next) => {
    const ua = req.headers['user-agent'];
    // This simple regex test checks if the user agent string contains 'mobile'
    res.locals.isMobile = /Mobi|Android|iPhone|iPad|iPod|Kindle|Silk/i.test(ua);
    next();
  });
// Set up multer
/*const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    }
    filename: (req, file, cb) => {
        cb(null, 'avatar_' + req.UID + path.extname(file.originalname)); // Save as avatar_<UID>
    }
})

const upload = multer({
    storage: storage,
    limits: { filesize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png/;
        const extension = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowed.test(file.mimetype);

        if (extension && mimeType) {
            return cb(null, true);
        } else {
            cb(new Error('Only .jpeg, .jpg, and .png files can be uploaded!'));
        }
    }
})*/

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
app.use('/allRecipes', allRecipesRouter(db));
app.use('/createRecipes',createRecipesRouter(db));
app.use('/recommendation', recommendationRoutes(db));
app.use('/generateRecipe',generateRecipeRouter(db));
app.use('/userProfile', profileRouter(db));
// Main routes

app.get('/', (req, res) => {
    const username = req.session.username;

    res.render('mainPage', {username});
    console.log(req.session);
    console.log(req.session.id);
    req.session.visited = true;
});

