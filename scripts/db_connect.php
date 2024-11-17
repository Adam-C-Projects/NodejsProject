<?php
// Database connection settings
$host = "Mylocalconnection";
$user = "root";       // Replace with your MySQL username
$password = "Gold_tiger12";       // Replace with your MySQL password
$database = "Recipes4U";

// Create a connection
$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
