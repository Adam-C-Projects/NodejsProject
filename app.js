//DEPENDANCIES NEEDED
const express = require('express');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt')
const app = express();
const PORT = 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Ensure EJS files are placed in the 'views' folder

// Create a connection to the database
const db = mysql.createConnection({
  host: 'dragon.kent.ac.uk',
  user: 'pi48',
  password: '4terfou',
  database: "pi48"
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

//route and cookie setup
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser("test"));
app.use(
    session({
        secret : "test session",
        saveUninitialized: false,
        resave: false,
        cookie: {
            maxAge: 6000 * 60,
            signed: true,
        }, 
    })
);
app.use(express.urlencoded({ extended: true }));

//main route (mainpage) setup and session start
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views','mainPage.html'));
    console.log(req.session);
    console.log(req.session.id);
    req.session.visited = true;
});

// This route redirects to login.html
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname,'views','login.html')); // Assuming login.html is in the 'public' folder
});

// This route handles the redirection to the login page
app.get('/redirect-login', (req, res) => {
    res.redirect('/login.html');  // This redirects to login.html
});

// This route redirects to register.html
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname,'views','register.html')); // Assuming login.html is in the 'public' folder
});

// This route handles the redirection to the register page
app.get('/redirect-register', (req, res) => {
    res.redirect('/register.html');  // This redirects to login.html
});


//This runs when the login form is submited
app.post('/login/submit' , (req,res) =>{
    console.log(req.body);
    const { username, password } = req.body;

    // Query database to find user by username
  db.query('SELECT * FROM User WHERE username = ?', [username], (err, results) => {
    if (err) {
      console.error('Database query error: ', err);
      return res.status(500).send('Database error');
    }

    if (results.length > 0) {
      const user = results[0];

      //Check if the password matches
      console.log(password);
      console.log(user.password_hash);
      bcrypt.compare(password, user.password_hash, (err, isMatch) => {
        if (err) {
          console.error('Error comparing passwords: ', err);
          return res.status(500).send('Error comparing passwords');
        }

        if (isMatch) {
          // Store user info in session
          req.session.username = username;
          req.session.loggedIn = true;

          // Redirect to homepage
          res.redirect('/');
        } else {
          res.status(401).send('Invalid credentials');
        }
      });
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});

//routes to saved recipes and outputs any saved reicepies stored by session user
app.get('/savedRecipes.ejs', (req, res) => {
    
    const username = req.session.username;
    if (!username) {
        return res.redirect('/login.html'); // If the user is not logged in, redirect to login
    }
  
    db.query(
        `SELECT r.*
         FROM SavedRecipes sr
         JOIN Recipes r ON sr.RID = r.RID
         JOIN User u ON sr.UID = u.UID
         WHERE u.username = ?`,
        [username],
        (err, recipeResults) => {
            if (err) {
                console.error('Error fetching saved recipes: ', err);
                return res.status(500).send('Error fetching saved recipes');
            }

            if (recipeResults.length === 0) {
                return res.send('No saved recipes found for this user.');
            }

            // Render the savedRecipes.ejs file and pass the recipes data
            res.render('savedRecipes', { recipes: recipeResults });
        }
    );
  });
  // route to fetch all recipes from the recipes database
app.get('/all-recipes', (req, res) => {
  recipeDB.query('SELECT * FROM Recipes', (err, results) => {
      if (err) {
          console.error('Error fetching all recipes: ', err);
          return res.status(500).send('Error fetching all recipes');
      }

      res.render('allRecipes', { recipes: results });
  });
});
