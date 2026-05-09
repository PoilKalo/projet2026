<?php

// Démarrage de la session pour pouvoir utiliser $_SESSION
session_start();

// Type de réponse
header("Content-Type: application/json");

// Connexion à la base de données
// require_once import config.php qui crée la variable $pdo
require_once "config.php";

/*********************************
 * Trouver la fonction a appeler *
 *********************************/
if(isset($_POST['myFunction'])){
    // fonction demandée par AJAX
    $myFunction = $_POST['myFunction'];

    // liste des fonctions autorisées
    $fonctionsAutorisees = [
        "login",
        "checkSession",
        "logout",
        "getObjets",
        "addObjet",
        "getFormObjetData",
        "getObjetById",
        "updateObjet",
        "deleteObjet",
        "getCategories",
        "addCategorie",
        "getCategorieById",
        "updateCategorie",
        "deleteCategorie",
        "getSites",
        "addSite",
        "getSiteById",
        "updateSite",
        "deleteSite",
        "getLocaux",
        "addLocal",
        "getLocalById",
        "updateLocal",
        "deleteLocal",
        "getRangements",
        "addRangement",
        "getRangementById",
        "updateRangement",
        "deleteRangement",
        "getNiveaux",
        "getNiveauById",
        "updateNiveau",
        "addNiveau",
        "deleteNiveau",
        "getPrets",
        "addPret",
        "retourPret",
        "getHistoriquePrets",


        "getUtilisateurs"
    ];

    // Vérification de la sécurité
    if(in_array($myFunction, $fonctionsAutorisees)){
        $myFunction($pdo);
    } else{
        echo json_encode([
            "success" => false,
            "message" => "Fonction non autorisée"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Aucune fonction reçu"
    ]);
}


/********************
 * FONCTION : login *
 ********************/
function login($pdo){

    // Récupération des données envoyées par AJAX
    $login = $_POST['login'] ?? "";
    $mdp = $_POST['mdp'] ?? "";

    // Requête préparée
    $req = $pdo->prepare("SELECT * FROM utilisateur WHERE login=?");
    $req->execute([$login]);

    $user = $req->fetch(PDO::FETCH_ASSOC);

    // Vérification
    if($user && $mdp === $user['mdp']){

        // Stockage en session
        $_SESSION["idUtilisateur"] = $user['idUtilisateur'];
        $_SESSION["nomUtilisateur"] = $user['nomUtilisateur'];
        $_SESSION["prenomUtilisateur"] = $user['prenomUtilisateur'];
        $_SESSION['role'] = $user['role'];

        // Réponse courte
        echo json_encode([
            "success" => true,
            "message" => "Connexion réussie",
            "role" => $user['role']
        ]);

    } else {
        // Réponse erreur
        echo json_encode([
            "success" => false,
            "message" => "Login ou mot de passe incorrect"
        ]);
    }
}

/***************************
 * FONCTION : chechSession *
 ***************************/
function checkSession($pdo){

    if(isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "connected" => true,
            "nomUtilisateur" => $_SESSION["nomUtilisateur"],
            "prenomUtilisateur" => $_SESSION["prenomUtilisateur"],
            "role" => $_SESSION["role"]
        ]);

    } else {
        echo json_encode([
            "connected" => false
        ]);
    }
}


/*********************
 * FONCTION : logout *
 *********************/
function logout($pdo){

    $_SESSION = [];
    session_destroy();

    echo json_encode([
        "success" => true,
        "message" => "Déconnexion réusisie"
    ]);
}

/************************
 * FONCTION : getObjets *
 ************************/
function getObjets($pdo){

    $req = $pdo->prepare("
    SELECT 
        objet.idObjet,
        objet.nom AS nomObjet,
        objet.statut,
        objet.infoPlus,
        categorie.nom AS nomCategorie,
        niveau.nom AS nomNiveau,
        rangement.nom AS nomRangement,
        local.nom AS nomLocal,
        site.nom AS nomSite,
        utilisateur.nomUtilisateur,
        utilisateur.prenomUtilisateur

    FROM objet

    INNER JOIN categorie
        ON objet.idCategorie = categorie.idCategorie
    
    INNER JOIN niveau
        ON objet.idNiveau = niveau.idNiveau

    INNER JOIN rangement
        ON niveau.idRangement = rangement.idRangement

    INNER JOIN local
        ON rangement.idLocal = local.idLocal

    INNER JOIN site
        ON local.idSite = site.idSite

    INNER JOIN utilisateur
        ON objet.idUtilisateur = utilisateur.idUtilisateur

    ORDER BY objet.nom
    ");

    $req->execute();

    $objets = $req->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "objets" => $objets
    ]);
}

/***********************************
 * FONCTION : getFormObjetData     *
 * Rôle : récupérer les catégories *
 * Et les niveaux pour remplir     *
 * Les select du formulaire objet  *
 ***********************************/
function getFormObjetData($pdo){

    // Récupération des catégories
    $reqCat = $pdo->prepare("SELECT * FROM categorie ORDER BY nom");
    $reqCat->execute();
    $categories = $reqCat->fetchAll(PDO::FETCH_ASSOC);

    // Récupération des niveaux avec leurs emplacement complet
    $reqNiv = $pdo->prepare("
    SELECT
        niveau.idNiveau,
        niveau.nom as nomNiveau,
        rangement.nom AS nomRangement,
        local.nom AS nomLocal,
        site.nom AS nomSite
    
    FROM niveau

    INNER JOIN rangement ON niveau.idRangement = rangement.idRangement
    INNER JOIN local ON rangement.idLocal = local.idLocal
    INNER JOIN site ON local.idSite = site.idSite
    ORDER by site.nom, local.nom, rangement.nom, niveau.nom
    ");

    $reqNiv->execute();

    $niveaux = $reqNiv->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "categories" => $categories,
        "niveaux" => $niveaux
    ]);
}

/******************************************
 * FONCTION : addObjet (Ajouter un objet) *
 ******************************************/
function addObjet($pdo){

    // Vérifie si l'utilisateur est connecté
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    // Seuls les admins et les owners peuvent ajouter
    if($_SESSION['role'] !== "admin" && $_SESSION['role'] !== "owner"){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas le droit d'ajouter un objet."
        ]);
        return;
    }

    // Données reçu du formulaire
    $nom = $_POST["nom"] ?? "";
    $idCategorie = $_POST["idCategorie"] ?? "";
    $idNiveau = $_POST['idNiveau'] ?? "";
    $infoPlus = $_POST['infoPlus'] ?? "";
    $statut = $_POST["statut"] ?? "disponible";
    $infoRangement = $_POST["infoRangement"] ?? "";

    // Insertion SQL
    $req = $pdo->prepare("
    INSERT INTO objet
    (nom, infoRangement, photo, idCategorie, idNiveau, infoPlus, idUtilisateur, statut)
    VALUES
    (?,?,NULL,?,?,?,?,?)
    ");

    $req->execute([
        $nom,
        $infoRangement,
        $idCategorie,
        $idNiveau,
        $infoPlus,
        $_SESSION['idUtilisateur'],
        $statut
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Objet ajouté avec succès"
    ]);
}

/**********************************************************************
 * FONCTION : getobjetById (Récupérer un objet en focntion de son id) *
 **********************************************************************/

function getObjetById($pdo){

    $idObjet = $_POST['idObjet'] ?? "";

    $req = $pdo->prepare("
    SELECT * from objet
    where idObjet = ?");

    $req->execute([$idObjet]);

    // Récupère un tableau associatif
    $objet = $req->fetch(PDO::FETCH_ASSOC);

    if($objet){
        echo json_encode([
            "success" => true,
            "objet" => $objet
        ]);
    } else {
        echo json_encode([
            "succes" => false,
            "message" => "Objet introuvable"
        ]);
    }
}

/*********************************************
 * FONCTION : updateObjet (modifie un objet) *
 *********************************************/
function updateObjet($pdo){

    // Vérifier si connecté
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    // Récupération des variables en POST
    $idObjet = $_POST['idObjet'] ?? "";
    $nom = $_POST['nom'] ?? "";
    $infoRangement = $_POST['infoRangement'] ?? "";
    $infoPlus = $_POST['infoPlus'] ?? "";
    $statut = $_POST['statut'] ?? "";

    // Vérifier que l'objet existe
    $reqCheck = $pdo->prepare("
        select idUtilisateur
        from objet
        where idObjet = ?
    ");

    $reqCheck->execute([$idObjet]);

    $objet = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if(!$objet){
        echo json_encode([
            "success" => false,
            "message" => "Objet introuvable."
        ]);
        return;
    }

    /*********************************************************
     * VERIFICATION DES DROITS : admin ou propriétaire objet *
     *********************************************************/
    if($_SESSION['idUtilisateur'] != $objet['idUtilisateur']  && $_SESSION['role'] !== "admin"){

        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits de modifier cet objet."
        ]);
        return;
    }

    // Préparation de la requête
    $req = $pdo->prepare("
        update objet 
        set nom = ?,
            infoRangement = ?,
            infoPlus = ?,
            statut = ?
        where idObjet = ?
    ");

    // Executer la requête 
    $req->execute([
        $nom, 
        $infoRangement,
        $infoPlus,
        $statut,
        $idObjet]);
    
    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true, 
            "message" => "Objet modifié avec succès"
        ]);
    } else {
        // Si objet pas trouvé ou aucune modification apporté
        echo json_encode([
            "success" => false,
            "message" => "Aucune modification effectuée"
        ]);
    }
}

/***********************************************
 * FONCTION : deleteObjet (supprimer un objet) *
 ***********************************************/
function deleteObjet($pdo){

    // Vérifier si on est connecté
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    // Récupération de l'id objet a supprimer
    $idObjet = $_POST['idObjet'];

    // vérifier que l'objet existe 
    $reqCheck = $pdo->prepare("
        select idUtilisateur 
        from objet
        where idObjet = ?
    ");

    $reqCheck->execute([$idObjet]);

    $objet = $reqCheck->fetch(PDO:: FETCH_ASSOC);

    if(!$objet){
        echo json_encode([
            "success" => false,
            "message" => "Objet introuvable."
        ]);
        return;
    }

    if($_SESSION['idUtilisateur'] != $objet['idUtilisateur'] && $_SESSION['role'] !== 'admin'){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits de suppression sur cet objet."
        ]);
        return;
    }

    $req = $pdo->prepare("
        delete from objet 
            where idObjet = ?
    ");

    $req->execute([$idObjet]);

    if($req->rowCount() > 0)
    {
        echo json_encode([
            "success" => true,
            "message" => "Objet supprimer avec succès"
        ]);
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Erreur lors de la suppression."
        ]);
    }


}


/*****************************************************
 * FONCTION : getCategories (renvoie les catégories) *
 *****************************************************/
function getCategories($pdo){

    $req = $pdo->prepare("
        select * from categorie
        order by nom
    ");

    $req->execute();

    $categories = $req->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "categories" => $categories
    ]);
}

/***************************************************
 * FONCTION : addCategorie (ajout d'une catégorie) *
 ***************************************************/
function addCategorie($pdo){

    // Vérifier si user = connecté 
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    // Seulement pour les owner et admin
    if($_SESSION['role'] !== "owner" && $_SESSION['role'] !== "admin"){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas le droit d'ajouter une catégorie."
        ]);
        return;
    }

    // Récupération des données
    $nom = $_POST['nom'] ?? "";
    $infoPlus = $_POST['infoPlus'] ?? "";

    // nom = obligatoire
    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom de la catégorie est obligatoire."
        ]);
        return;
    }

    // Ajout
    $req = $pdo->prepare("
    insert into categorie (nom, infoPlus)
    values
    (?,?)
    ");

    $req->execute([
        $nom,
        $infoPlus
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Catégorie ajoutée avec succès."
    ]);
}

/********************************************************************
 * FONCTION : getCategorieById ( trouver une catégorie avec son ID) *
 ********************************************************************/
function getCategorieById($pdo){

    $idCategorie = $_POST['idCategorie'];
    
    $req = $pdo->prepare("
    select * from categorie where idCategorie = ?
    ");

    $req->execute([$idCategorie]);

    $cat = $req->fetch(PDO::FETCH_ASSOC);

    if(!$cat){
        echo json_encode([
            "success" => false,
            "message" => "Catégorie introuvable."
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "categorie" => $cat 
    ]);
}

/******************************************************
 * FONCTION : updateCategorie (modifié une catégorie) *
 ******************************************************/
function updateCategorie($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION['role'] !== "admin"){
        echo json_encode([
            "success" => false,
            "message" => "Seul un admin peut modifier une catégorie"
        ]);
        return;
    }

    $idCategorie = $_POST['idCategorie'];
    $nom = $_POST['nom'];
    $infoPlus = $_POST['infoPlus'];

    $req = $pdo->prepare("
        update categorie
        set nom = ?, infoPlus = ?
        where idcategorie = ?
    ");

    $req->execute([
        $nom,
        $infoPlus,
        $idCategorie
    ]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Catégorie modifiée avec succès."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Aucune modification effectuée"
        ]);
    }

}

/*******************************
 *  FONCTION : deleteCategorie *
 *******************************/
function deleteCategorie($pdo){

    // Vérifier si connecté
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté"
        ]);
        return;
    }

    // Seul l'admin peut supprimer 
    if($_SESSION['role'] !== 'admin'){
        echo json_encode([
            "success" => false,
            "message" => "Seul un admin peut supprimer une catégorie."
        ]);
        return;
    }

    $idCategorie = $_POST['idCategorie'];

    // Vérifier qu'aucun n'objet n'utilise cette catégorie
    $reqCheck = $pdo->prepare("
        select count(*) as total
        from objet
        where idCategorie = ?
    ");

    $reqCheck->execute([$idCategorie]);

    $result = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if($result['total'] > 0){
        echo json_encode([
            "success" => false,
            "message" => "Impossible de supprimer cette catégorie car elle est utilisée par un ou plusieurs objets."
        ]);
        return;
    }

    // Suppression
    $req = $pdo->prepare("
        delete from categorie
        where idCategorie = ?
    ");

    $req->execute([$idCategorie]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Catégorie supprimer avec succès."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Catégorie introuvable."
        ]);
    }

}

/**************************************************
 * FONCTION : getSites (recupérer tout les sites) *
 **************************************************/
function getSites($pdo){

    $req = $pdo->prepare("
        select *
        from site
        order by nom
    ");

    $req->execute();

    $sites = $req->fetchAll(PDO::FETCH_ASSOC);

    if(count($sites) === 0){
        echo json_encode([
            "success" => false,
            "message" => "Aucun site trouvé"
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "sites" => $sites 
    ]);
}

/****************************************
 * FONCTION : addSite (ajouter un site) *
 ****************************************/
function addSite($pdo){

    // Vérifier la connexion
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    // Seuls les admins et les owners peuvent ajouter un site 
    if($_SESSION['role'] !== "admin" && $_SESSION['role'] !== "owner"){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour ajouter un site"
        ]);
        return;
    }

    // Récupération des données
    $nom = $_POST["nom"] ?? "";
    $adresse = $_POST["adresse"] ?? "";
    $code_postal = $_POST["code_postal"] ?? "";
    $localite = $_POST["localite"] ?? "";
    $photo = $_POST["photo"] ?? "";

    // Vérifier extension photo 
    if($photo !== "" && !preg_match('/\.jpg$/i',$photo)){
        echo json_encode([
            "success" => false,
            "message" => "La photo doit être au format jpg"
        ]);
        return;
    }

    // vérifier si il y a bien un nom
    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du site est obligatoire"
        ]);
        return;
    }

    // Requête
    $req = $pdo->prepare("
        insert into site (
            nom,
            adresse,
            code_postal,
            localite,
            photo
        )
        values (?,?,?,?,?)
    ");

    $req->execute([
        $nom,
        $adresse,
        $code_postal,
        $localite,
        $photo
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Site ajouté avec succès"
    ]);
}

/********************************************************************
 * FONCTION : getSiteById (récupérer un site en fonctionde son id ) *
 ********************************************************************/
function getSiteById($pdo){

    $idSite = $_POST['idSite'] ?? "";

    $req = $pdo->prepare("
    select * 
    from site
    where idSite = ?
    ");

    $req->execute([$idSite]);

    $site = $req->fetch(PDO:: FETCH_ASSOC);

    if(!$site){
        echo json_encode([
            "success" => false,
            "message" => "Site introuvable"
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "site" => $site
    ]);
}

/********************************************************
 * FONCTION : updateSite (modifier les valeurs du site) *
 ********************************************************/
function updateSite($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'owner'){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour modifier un site."
        ]);
        return;
    }

    $idSite = $_POST['idSite'];
    $nom = $_POST['nom'];
    $adresse = $_POST['adresse'];
    $code_postal = $_POST['code_postal'];
    $localite = $_POST['localite'];
    $photo = $_POST['photo'];

    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du site est obligatoire"
        ]);
        return;
    }

    if($photo !== "" && !preg_match('/\.jpg$/i',$photo)){
        echo json_encode([
            "success" => false,
            "message" => "La photo doit être au format .jpg"
        ]);
        return;
    }

    // Vérifier l'existence du site 
    $reqCheck = $pdo->prepare("
        select * 
        from site
        where idSite = ?
    ");

    $reqCheck->execute([$idSite]);

    $site = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if(!$site){
        echo json_encode([
            "success" => false,
            "message" => "Site introuvable"
        ]);
        return;
    }

    $req = $pdo->prepare("
        update site
        set nom = ?,
            adresse = ?,
            code_postal = ?,
            localite = ?,
            photo = ?
        where idSite = ?
    ");

    $req->execute([
        $nom,
        $adresse,
        $code_postal,
        $localite,
        $photo,
        $idSite
    ]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Site modifié avec succès."
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Aucune modification effectuée."
        ]);
    }
}

/***************************************************************************
 * FONCTION : deleteSite (supprimer un site sauf si il a un local associé) *
 ***************************************************************************/
function deleteSite($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin'){
        echo json_encode([
            "success" => false,
            "message" => "Seul un admin peut supprimer un site"
        ]);
        return;
    }

    $idSite = $_POST['idSite'] ?? "";

    $reqCheck = $pdo->prepare("
        select count(*) as total
        from local
        where idSite = ?
    ");

    $reqCheck->execute([$idSite]);

    $result = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if($result['total'] > 0){
        echo json_encode([
            "success" => false,
            "message" => "Impossible de supprimer ce site car il contient des locaux."
        ]);
        return;
    }

    $req = $pdo->prepare("
        delete from site
        where idSite = ?
    ");

    $req->execute([$idSite]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Site supprimé avec succès."
        ]);
        return;
    } else{
        echo json_encode([
            "success" => false,
            "message" => "Site introuvable."
        ]);
    }
}

/************************
 * FONCTION : getLocaux *
 ************************/
function getLocaux($pdo){

    $req = $pdo->prepare("
        select
            local.idLocal,
            local.nom as nomLocal,
            local.infoLocal,
            local.photo,
            site.nom as nomSite
        from local
        inner join site on local.idSite = site.idSite
        order by site.nom, local.nom
    ");

    $req->execute();
    $locaux = $req->fetchAll(PDO::FETCH_ASSOC);

    if(count($locaux) === 0){
        echo json_encode([
            "success" => false,
            "message" => "Aucun local trouvé"
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "locaux" => $locaux
    ]);
}

/*********************
 * FONCTION addLocal *
 *********************/
function addLocal($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION["role"] !== "admin" && $_SESSION['role'] !== "owner"){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour ajouter un local"
        ]);
        return;
    }

    $nom = $_POST["nom"] ?? "";
    $idSite = $_POST["idSite"] ?? "";
    $infoLocal = $_POST["infoLocal"] ?? "";
    $photo = $_POST["photo"] ?? "";

    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du local est obligatoire"
        ]);
        return;
    }

    if($photo !== "" && !preg_match("/\.jpg$/i",$photo)){
        echo json_encode([
            "success" => false,
            "message" => "la photo doit être au format .jpg"
        ]);
        return;
    }

    // Vérifier que le site existe 
    $reqCheck = $pdo->prepare("
    select *
    from site
    where idSite = ?
    ");

    $reqCheck->execute([$idSite]);

    $site = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if(!$site){
        echo json_encode([
            "success" => false,
            "message" => "Site introuvable"
        ]);
        return;
    }

    $req = $pdo->prepare("
        insert into local (
            nom,
            idSite,
            infoLocal,
            photo
        )
        values (?, ?, ?, ?)
    ");

    $req->execute([
        $nom,
        $idSite,
        $infoLocal,
        $photo
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Local ajouté avec succès"
    ]);
}

/***************************
 * FONCTION : getLocalById *
 ***************************/
function getLocalById($pdo){
    $idLocal = $_POST['idLocal'];

    $req = $pdo->prepare("
    select * 
    from local 
    where idLocal = ?"
    );

    $req->execute([$idLocal]);

    $local = $req->fetch(PDO::FETCH_ASSOC);

    if(!$local){
        echo json_encode([
            "success" => false,
            "message" => "Local introuvable."
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "local" => $local
    ]);
}

/**************************
 * FONCTION : updateLocal *
 **************************/
function updateLocal($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté"
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'owner'){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour modifier un local"
        ]);
        return;
    }

    $idLocal = $_POST['idLocal'] ?? "";
    $nom = $_POST['nom'] ?? "";
    $idSite = $_POST['idSite'] ?? "";
    $infoLocal = $_POST['infoLocal'] ?? "";
    $photo = $_POST['photo'] ?? "";

    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du local est obligatoire"
        ]);
        return;
    }

    if($photo !== "" && !preg_match("/\.jpg$/i",$photo)){
        echo json_encode([
            "success" => false,
            "message" => "La photo doit être au format .jpg"
        ]);
        return;
    }

    $reqCheckLocal = $pdo->prepare("
        select * 
        from local
        where idLocal = ?
    ");

    $reqCheckLocal->execute([$idLocal]);
    $local = $reqCheckLocal->fetch(PDO::FETCH_ASSOC);

    if(!$local){
        echo json_encode([
            "success" => false,
            "message" => "Local introuvable"
        ]);
        return;
    }

    $reqCheckSite = $pdo->prepare("
        select * 
        from site
        where idSite = ?
    ");

    $reqCheckSite->execute([$idSite]);
    $site = $reqCheckSite->fetch(PDO::FETCH_ASSOC);

    if(!$site){
        echo json_encode([
            "success" => false,
            "message" => "Le site est introuvable"
        ]);
        return;
    }

    $req = $pdo->prepare("
        update local
        set nom = ?,
            idSite = ?,
            infoLocal = ?,
            photo = ?
        where idLocal = ?
    ");

    $req->execute([
        $nom,
        $idSite,
        $infoLocal,
        $photo,
        $idLocal
    ]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Local modifié avec succès"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Aucune modification effectuée"
        ]);
    }
}

/**************************
 * FONCTION : deleteLocal *
 **************************/
function deletelocal($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté"
        ]);
        return;
    }

    if($_SESSION['role'] !== "admin"){
        echo json_encode([
            "success" => false,
            "message" => "Seul un admin peut supprimer un local"
        ]);
        return;
    }


    $idLocal = $_POST['idLocal'];

    $reqCheck = $pdo->prepare("
        select count(*) as total
        from rangement
        where idLocal = ?
    ");

    $reqCheck->execute([$idLocal]);

    $result = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if($result['total'] > 0){
        echo json_encode([
            "success" => false,
            "message" => "Impossible de supprimer ce local car il contient des rangements"
        ]);
        return;
    }

    $req = $pdo->prepare("
        delete from local
        where idLocal = ?
    ");

    $req->execute([$idLocal]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Local supprimé avec succès"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Local introuvable"
        ]);
    }
}
/****************************
 * FONCTION : getRangements *
 ****************************/
function getRangements($pdo){
    $req = $pdo->prepare("
        select
            rangement.idRangement,
            rangement.nom as nomRangement,
            rangement.infoRangement,
            rangement.photo,
            local.nom as nomLocal,
            site.nom as nomSite
        from rangement

        inner join local
            on rangement.idLocal = local.idLocal
        inner join site
            on local.idSite = site.idSite
        order by site.nom, local.nom, rangement.nom
    ");

    $req->execute();

    $rangements = $req->fetchAll(PDO::FETCH_ASSOC);

    if(count($rangements) === 0){
        echo json_encode([
            "success" => false,
            "message" => "Aucun rangement trouvé."
        ]);
        return;
    } 

    echo json_encode([
        "success" => true,
        "rangements" =>$rangements
    ]);
}

/***************************
 * FONCTION : addRangement *
 ***************************/
function addRangement($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== "owner"){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour ajouter un rangement."
        ]);
        return;
    }

    $nom = $_POST['nom'] ?? "";
    $infoRangement = $_POST['infoRangement'] ?? "";
    $idLocal = $_POST['idLocal'] ?? "";
    $photo = $_POST['photo'] ?? "";

    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du rangement est obligatoire"
        ]);
        return;
    }

    if($photo !== "" && !preg_match('/\.jpg$/i', $photo)){
        echo json_encode([
            "success" => false,
            "message" => "Le photo doit être au format .jpg"
        ]);
        return;
    }

    $reqCheck = $pdo->prepare("
        select *
        from local
        where idLocal = ?
    ");

    $reqCheck->execute([$idLocal]);

    $local = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if(!$local){
        echo json_encode([
            "success" => false,
            "message" => "local introuvable"
        ]);
        return;
    }

    $req = $pdo->prepare("
        insert into rangement
        (nom, infoRangement, idLocal, photo)
        values
        (?, ?, ?, ?)
    ");

    $req->execute([
        $nom,
        $infoRangement,
        $idLocal,
        $photo
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Rangement ajouté avec succès"
    ]);
}

/*******************************
 * FONCTION : getRangementById *
 *******************************/
function getRangementById($pdo){

    $idRangement = $_POST['idRangement'] ?? ""; 

    $req = $pdo->prepare("
        select * 
        from rangement 
        where idRangement = ?
    ");

    $req->execute([$idRangement]);

    $rangement = $req->fetch(PDO::FETCH_ASSOC);

    if(!$rangement){
        echo json_encode([
            "success" => false,
            "message" => "Rangement introuvable"
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "rangement" => $rangement
    ]);
}

/******************************
 * FONCTION : updateRangement *
 ******************************/
function updateRangement($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté"
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'owner'){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour modifier un rangement"
        ]);
        return;
    }

    $idRangement = $_POST['idRangement'] ?? "";
    $nom = $_POST['nom'] ?? "";
    $idLocal = $_POST['idLocal'] ?? "";
    $infoRangement = $_POST['infoRangement'] ?? "";
    $photo = $_POST['photo'] ?? "";

    if(!$nom){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du rangement est obligatoire"
        ]);
        return;
    }

    if($photo !== "" && !preg_match('/\.jpg$/i', $photo)){
        echo json_encode([
            "success" => false,
            "message" => "La photo doit être au format jpg"
        ]);
        return;
    }

    $reqCheckRangement = $pdo->prepare("
        select *
        from rangement
        where idRangement = ?
    ");

    $reqCheckRangement->execute([$idRangement]);

    $rangement = $reqCheckRangement->fetch(PDO::FETCH_ASSOC);

    if(!$rangement){
        echo json_encode([
            "success" => false,
            "message" => "Rangement introuvable"
        ]);
        return;
    }

    $reqCheckLocal = $pdo->prepare("
        select *
        from local
        where idLocal = ?
    ");

    $reqCheckLocal->execute([$idLocal]);

    $local = $reqCheckLocal->fetch(PDO::FETCH_ASSOC);

    if(!$local){
        echo json_encode([
            "success" => false,
            "message" => "Local introuvable"
        ]);
    }

    $req = $pdo->prepare("
        update rangement
        set nom = ?,
            infoRangement = ?,
            idLocal = ?,
            photo = ?
        where idRangement = ?
    ");

    $req->execute([
        $nom,
        $infoRangement,
        $idLocal,
        $photo,
        $idRangement
    ]);

    if($req->rowCount() > 0 ){
        echo json_encode([
            "success" => true,
            "message" => "rangement modifié avec succès"
        ]);
    } else {
        
        echo json_encode([
            "success" => false,
            "message" => "Aucune modification effectuée."
        ]);
        return;
    }
}

/******************************
 * FONCTION : deleteRangement *
 ******************************/
function deleteRangement($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION['role'] !=='admin'){
        echo json_encode([
            "success" => false,
            "message" => "Seul un admin peut supprimer un rangement"
        ]);
        return;
    }

    $idRangement = $_POST['idRangement'] ?? "";

    // Vérifier les niveaux liés
    $reqCheck = $pdo->prepare("
        select count(*) as total 
        from niveau
        where idRangement = ?
    ");
    $reqCheck->execute([$idRangement]);

    $result = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if($result['total'] > 0){
        echo json_encode([
            "success" => false,
            "message" => "Impossible de supprimer ce rangement car il contient des niveaux."
        ]);
        return;
    }

    $req = $pdo->prepare("
        delete 
        from rangement 
        where idRangement = ? 
    ");

    $req->execute([$idRangement]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Rangement supprimé avec succès."
        ]);
        return;
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Rangement introuvable"
        ]);
    }
}

/*************************
 * FONCTION : getNiveaux *
 *************************/
function getNiveaux($pdo){

    $req = $pdo->prepare("
        select 
            niveau.idNiveau,
            niveau.nom as nomNiveau,
            niveau.infoNiveau,
            niveau.photo,
            rangement.nom as nomRangement,
            local.nom as nomLocal,
            site.nom as nomSite

        from niveau 
        
        inner join rangement
            on niveau.idRangement = rangement.idRangement

        inner join local
            on rangement.idLocal = rangement.idRangement
        
        inner join site
            on local.idSite = site.idSite

        order by site.nom, local.nom, rangement.nom, niveau.nom

    ");

    $req->execute();

    $niveaux = $req->fetchAll(PDO::FETCH_ASSOC);

    if(count($niveaux) === 0){
        echo json_encode([
            "success" => false,
            "message" => "Aucun niveau trouvé."
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "niveaux" => $niveaux
    ]);
}

/****************************
 * FONCTION : getNiveauById *
 ****************************/
function getNiveauById($pdo){

    $idNiveau = $_POST['idNiveau'];

    $req = $pdo->prepare("
        select * 
        from niveau 
        where idNiveau = ?
    ");

    $req->execute([$idNiveau]);

    $niveau = $req->fetch(PDO::FETCH_ASSOC);

    if(!$niveau){
        echo json_encode([
            "success" => false,
            "message" => "Aucun niveau trouvé"
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "niveau" => $niveau
    ]);
}

/***************************
 * FONCTION : updateNiveau *
 ***************************/
function updateNiveau($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'owner'){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour modifier un niveau."
        ]);
        return;
    }

    $idNiveau = $_POST['idNiveau'] ?? "";
    $nom = $_POST['nom'] ?? "";
    $idRangement = $_POST['idRangement'] ?? "";
    $infoNiveau = $_POST['infoNiveau'] ?? "";
    $photo = $_POST['photo'] ?? "";

    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du niveau est obligatoire"
        ]);
        return;
    }
    
    if($photo !== "" && !preg_match("/\.jpg$/i", $photo)){
        echo json_encode([
            "success" => false,
            "message" => "La phot doit être au format .jpg"
        ]);
        return;
    }

    $recqCheckNiveau = $pdo->prepare("
        select *
        from niveau
        where idNiveau = ?
    ");

    $recqCheckNiveau->execute([$idNiveau]);

    $niveau = $recqCheckNiveau->fetch(PDO::FETCH_ASSOC);

    if(!$niveau){
        echo json_encode([
            "success" => false,
            "message" => "Niveau introuvable"
        ]);
        return;
    }

    $reqCheckRangement = $pdo->prepare("
        select * 
        from rangement
        where idRangement = ?
    ");

    $reqCheckRangement->execute([$idRangement]);

    $rangement = $reqCheckRangement->fetch(PDO::FETCH_ASSOC);

    if(!$rangement){
        echo json_encode([
            "success" => false,
            "message" => "Rangement introuvable"
        ]);
        return;
    }

    $req = $pdo->prepare("
        update niveau
        set nom = ?,
            idRangement = ?,
            infoNiveau = ?,
            photo = ?
        where idNiveau = ?
    ");

    $req->execute([
        $nom,
        $idRangement,
        $infoNiveau,
        $photo,
        $idNiveau
    ]);

    if($req->rowCount()> 0){
        echo json_encode([
            "success" => true,
            "message" => "Niveau modifié avec succès"
        ]);
        return;
    } else {
        echo json_encode([
            "success" => true,
            "message" => "Aucune modification effectuée."
        ]);
    }
}

/************************
 * FONCTION : addNiveau *
 ************************/
function addNiveau($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin' && $_SESSION['role'] !== 'owner'){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'avez pas les droits pour ajouter un niveau"
        ]);
        return;
    }

    $nom = $_POST['nom'] ?? "";
    $idRangement = $_POST['idRangement'] ?? "";
    $infoNiveau = $_POST['infoNiveau'] ?? "";
    $photo = $_POST['photo'] ?? "";

    if($nom === ""){
        echo json_encode([
            "success" => false,
            "message" => "Le nom du niveau est obligatoire"
        ]);
        return;
    }

    if($photo !== "" && !preg_match('/\.jpg$/i', $photo)){
        echo json_encode([
            "success" => false,
            "message" => "La photo doit être au format .jpg"
        ]);
        return;
    }
    $reqCheckRangement = $pdo->prepare("
        select * 
        from rangement
        where idRangement = ?
    ");

    $reqCheckRangement->execute([$idRangement]);

    $rangement = $reqCheckRangement->fetch(PDO::FETCH_ASSOC);

    if(!$rangement){
        echo json_encode([
            "success" => false,
            "message" => "Rangement introuvable"
        ]);
        return;
    }

    $req = $pdo->prepare("
        insert into niveau
        (nom, idRangement, infoNiveau, photo)
        values
        (?, ?, ?, ?)
    ");

    $req->execute([
        $nom,
        $idRangement,
        $infoNiveau,
        $photo
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Niveau ajouté avec succès."
    ]);
}

/***************************
 * FONCTION : deleteNiveau *
 ***************************/
function deleteNiveau($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté"
        ]);
        return;
    }

    if($_SESSION['role'] !== 'admin'){
        echo json_encode([
            "success" => false,
            "message" => "Seul un admin peut supprimer un niveau"
        ]);
        return;
    }

    $idNiveau = $_POST['idNiveau'];

    $reqCheck = $pdo->prepare("
        select count(*) as total
        from objet
        where idNiveau = ?
    ");

    $reqCheck->execute([$idNiveau]);

    $result = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if($result['total'] > 0){
        echo json_encode([
            "success" => false,
            "message" => "Impossible de supprimer ce niveau car il contient des objets"
        ]);
        return;
    }

    $req = $pdo->prepare("
        delete from niveau
        where idNiveau = ?
    ");

    $req->execute([$idNiveau]);

    if($req->rowCount() > 0){
        echo json_encode([
            "success" => true,
            "message" => "Niveau supprimé avec succès"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Niveau introuvable"
        ]);
    }
}

/***********************
 * FONCTION : getPrets *
 ***********************/
function getPrets($pdo){
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    $req = $pdo->prepare("
        select
            pret.idPret,
            pret.datePret,
            pret.dateRetourPrevue,
            pret.dateRetourReelle,
            pret.commentaire,

            objet.nom as nomObjet,

            utilisateur.nomUtilisateur,
            utilisateur.prenomUtilisateur

        from pret

        inner join objet
            on pret.idObjet = objet.idObjet
        
        inner join utilisateur
            on pret.idUtilisateur = utilisateur.idUtilisateur

        WHERE pret.dateRetourReelle IS NULL

        
        order by pret.datePret desc
    ");

    $req->execute();

    $prets = $req->fetchAll(PDO::FETCH_ASSOC);

    if(count($prets) === 0){
        echo json_encode([
            "success" => true,
            "prets" => []
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "prets" => $prets
    ]);
}






/******************************
 * FONCTION : getutilisateurs *
 ******************************/
function getUtilisateurs($pdo){

    if(!isset($_SESSION["idUtilisateur"])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    $req = $pdo->prepare("
        SELECT 
            idUtilisateur,
            nomUtilisateur,
            prenomUtilisateur,
            role
        FROM utilisateur
        ORDER BY nomUtilisateur, prenomUtilisateur
    ");

    $req->execute();

    $utilisateurs = $req->fetchAll(PDO::FETCH_ASSOC);

    if(count($utilisateurs) === 0){
        echo json_encode([
            "success" => false,
            "message" => "Aucun utilisateur trouvé."
        ]);
        return;
    }

    echo json_encode([
        "success" => true,
        "utilisateurs" => $utilisateurs
    ]);
}

/**********************
 * FONCTION : addPret *
 **********************/
function addPret($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous n'êtes pas connecté."
        ]);
        return;
    }

    $idObjet = $_POST['idObjet'];
    $idUtilisateur = $_POST['idUtilisateur'];
    $dateRetourPrevue = $_POST['dateRetourPrevue'];
    $commentaire = $_POST['commentaire'];

    // Vérifier objet
    $reqCheckObjet = $pdo->prepare("
        select * 
        from objet
        where idObjet = ?
    ");

    $reqCheckObjet->execute([$idObjet]);

    $objet = $reqCheckObjet->fetch(PDO::FETCH_ASSOC);

    if(!$objet){
        echo json_encode([
            "success" => false,
            "message" =>"Objet introuvable."
        ]);
        return;
    }

    // Vérifier user
    $reqCheckUser = $pdo->prepare("
        select *
        from utilisateur
        where idUtilisateur = ?
    ");

    $reqCheckUser->execute([$idUtilisateur]);

    $utilisateur = $reqCheckUser->fetch(PDO::FETCH_ASSOC);

    if(!$utilisateur){
        echo json_encode([
            "success" => false,
            "message" => "Utilisateur introuvable."
        ]);
        return;
    }

    // Vérifier si déjà prêté
    $reqPret = $pdo->prepare("
        select * 
        from pret
        where idObjet= ?
        and dateRetourReelle is null
    ");

    $reqPret->execute([$idObjet]);

    $pretExistant = $reqPret->fetch(PDO::FETCH_ASSOC);

    if($pretExistant){
        echo json_encode([
            "success" => false,
            "message" => "Cet objet est déjà prêté."
        ]);
        return;
    }

    $req = $pdo->prepare("
        insert into pret
        (
            idObjet,
            idUtilisateur,
            dateRetourPrevue,
            commentaire
        )
        values
        (?, ?, ?, ?)
    ");

    $req->execute([
        $idObjet,
        $idUtilisateur,
        $dateRetourPrevue,
        $commentaire
    ]);

    $reqUpdateObjet = $pdo->prepare("
        update objet
        set statut = 'prêté'
        where idObjet = ?
    ");

    $reqUpdateObjet->execute([$idObjet]);

    echo json_encode([
        "success" => true,
        "message" => "Prêt ajouté avec succès."
    ]);
}

/*************************
 * FONCTION : retourPret *
 *************************/
function retourPret($pdo){

    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté"
        ]);
        return;
    }

    $idPret = $_POST['idPret'];

    $reqCheck = $pdo->prepare("
        select *
        from pret
        where idPret = ?
    ");

    $reqCheck->execute([$idPret]);

    $pret = $reqCheck->fetch(PDO::FETCH_ASSOC);

    if(!$pret){
        echo json_encode([
            "success" => false,
            "message" => "Prêt introuvable"
        ]);
        return;
    }

    if($_SESSION['idUtilisateur'] != $pret['idUtilisateur'] && $_SESSION['role'] !== 'admin'){
        echo json_encode([
            "success" => false,
            "message" => "Vous ne pouvez pas rendre un prêt qui ne vous appartient pas."
        ]);
        return;
    }

    if($pret['dateRetourReelle'] !== null){
        echo json_encode([
            "success" => false,
            "message" => "Prêt déjà rendu"
        ]);
        return;
    }

    $req = $pdo->prepare("
        update pret
        set dateRetourReelle = CURRENT_DATE
        where idPret = ?
    ");

    $req->execute([$idPret]);

    $reqUpdateObjet = $pdo->prepare("
    UPDATE objet
    SET statut = 'disponible'
    WHERE idObjet = ?
    ");

$reqUpdateObjet->execute([$pret["idObjet"]]);

    echo json_encode([
        "success" => true,
        "message" => "Prêt retourné avec succès."
    ]);
}

/*********************************
 * FONCTION : getHistoriquePrets *
 *********************************/
function getHistoriquePrets($pdo){
    if(!isset($_SESSION['idUtilisateur'])){
        echo json_encode([
            "success" => false,
            "message" => "Vous devez être connecté."
        ]);
        return;
    }

    $req = $pdo->prepare("
        select
            pret.idPret,
            pret.datePret,
            pret.dateRetourPrevue,
            pret.dateRetourReelle,
            pret.commentaire,
            objet.nom as nomObjet,
            utilisateur.nomUtilisateur,
            utilisateur.prenomUtilisateur

        from pret

        inner join objet
            on pret.idObjet = objet.idObjet

        inner join utilisateur
            on pret.idUtilisateur = utilisateur.idUtilisateur
        
        where pret.dateRetourReelle is not null

        order by pret.dateRetourReelle desc
    ");

    $req->execute();

    $prets = $req->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "prets" => $prets
    ]);
}
?>