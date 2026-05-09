<?php

/********************************************************
 * INFORMATIONS DE CONNEXION A LA BASE DE DONNEES MySQL *
 ********************************************************/

$host = "localhost";
$port = "3308";
$dbname = "projet2026";
$username = "root";
$password = "";

/********************************************************
 * BLOC TRY / CATCH POUR GERER LES ERREURS DE CONNEXION *
 ********************************************************/
try{

    // Création de l'objet PDO
    // Vu que PDO ne travaill pas que avec mysql on précise que c'est avec lui ici (pas le même que "new mysql)
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    // Activation du mode d'erreur pour afficher les problèmes SQL
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
catch(PDOException $e){
    die("Erreur de connexion à la base de données : " .$e->getMessage());
}

?>