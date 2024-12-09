const express = require("express");;
const router = express.Router()
const path = require("path");

// This route redirects to register.html
router.get('/', (req, res) => {
    res.render('register'); // Assuming login.html is in the 'public' folder
});

// This route handles the redirection to the register page
router.get('/redirect-register', (req, res) => {
    res.redirect('/register');  // This redirects to login.html
});

module.exports = router