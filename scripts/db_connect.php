<?php
// Database connection settings
$host = "dragon.kent.ac.uk"; // Full server address
$user = "asc50";             // Your MySQL username
$password = "3ydonef";       // Your MySQL password
$database = "asc50";         // Your database name

// Create a connection
$conn = new mysqli($host, $user, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
else{
    echo "success";
}
?>
