<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $recipeName = $_POST['recipeName'];
    $ingredientName = $_POST['ingredientName'];
    $dietaryReq = $_POST['dietaryReq'];
    $macros = $_POST['macros'];
    $cookingTime = $_POST['cookingTime'];

    $query = "INSERT INTO Recipes (recipeName, ingredientName, dietaryReq, macros, cookingTime) 
              VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssssi", $recipeName, $ingredientName, $dietaryReq, $macros, $cookingTime);

    if ($stmt->execute()) {
        echo "Recipe added successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
}
?>

<?php
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    $searchTerm = "%" . $_GET['search'] . "%";

    $query = "SELECT * FROM Recipes WHERE recipeName LIKE ? OR ingredientName LIKE ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $searchTerm, $searchTerm);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        echo $row['recipeName'] . "<br>";
    }

    $stmt->close();
}
?>
