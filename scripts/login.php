<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];


    $query = "SELECT password_hash FROM User WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $stmt->bind_result($stored_password_hash);
    $stmt->fetch();

    if ($stored_password_hash && password_verify($password, $stored_password_hash)) {
        echo "Login successful!";
    } else {
        echo "Invalid username or password!";
    }

    $stmt->close();
}
?>
