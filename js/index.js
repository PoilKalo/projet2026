$(document).ready(function(){

    let roleUtilisateur = "";

    function showGlobalMessage(message,success){

        $("#globalMessage")
            .removeClass("text-success text-danger")
            .addClass(success ? "text-success" : "text-danger")
            .text(message)
            .show();

            // Scroll vers le message 
            $('html,body').animate({
                scrollTop: $("#globalMessage").offset().top -20
            }, 300);
        
        setTimeout(function(){
            $("#globalMessage").fadeOut();
        },2000);
    }

    /***********************
     * Vérifier la session *
     ***********************/
    $.ajax({
        url: 'api/api.php',
        method: 'POST',
        dataType: 'json',

        // Appel de la foonction PHP
        data: {
            myFunction: "checkSession"
        },

        success: function(response){

            // Si l'utilisateur est connecté
            if(response.connected){

                roleUtilisateur = response.role;
                // Affiche les infos dans la page
                $("#userInfo").text(
                    "Bonjour "
                    + response.prenomUtilisateur + " "
                    + response.nomUtilisateur 
                    + " (" + response.role +")"
                );

                // Si admin, afficher bouton admin
                if(response.role === 'admin'){
                    $("#btnAdmin").removeClass("d-none");
                }
                
                if(response.role === 'user'){
                    $("#btnAjouterObjet").addClass("d-none");
                }

            } else {
                // Pas connecté => retour au login
                window.location.href='login.html';
            }
        }
    });

    /**********
     * LOGOUT *
     **********/
    $("#btnLogout").click(function(){

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "logout"
            },

            success: function(response){
                // redirection vers le login
                window.location.href="login.html";
            }
        });
    });

    /*******************************
     * AFFICHAGE : tout les objets *
     *******************************/
    $("#btnObjet").click(function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getObjets"
            },

            success: function(response){

                /** BOOTSTRAP
                 * ==========
                 * table-responsive : permet de scroller sur mobile
                 * table-striped : une ligne sur deux coloré
                 * table-bordered : ajoute des bordures aux cellules
                 */
                if(response.success){

                    let colonneActions = "<th>Actions</th>";
                    let boutonsActions = "";
                    let colspan = 5;

                    if(roleUtilisateur === "admin" || roleUtilisateur === "owner"){
                        boutonsActions = `
                                <button class="btn btn-warning btn-sm btnModifierObjet" data-id="\${objet.idObjet}">
                                    Modifier
                                </button>

                                <button class="btn btn-danger btn-sm btnSupprimerObjet" data-id="\${objet.idObjet}">
                                    Supprimer
                                </button>
                        `;
                    }

                    boutonsActions += `
                        <button class="btn btn-success btn-sm btnPreterObjet" data-id="\${objet.idObjet}">
                            Prêter
                        </button>
                    `;

                    let html = `
                    <div class="card shadow p-4">
                        <h2 class="text-center mb-4">Liste des objets</h2>
                        
                        <div class="table-responsive"> 
                            <table class="table table-striped table-bordered">
                                <thead class="table-primary">
                                    <tr>
                                        <th>Nom</th>
                                        <th>Catégorie</th>
                                        <th>Statut</th>
                                        <th>Infos</th>
                                        <th>Photo</th>
                                        ${colonneActions}
                                    </tr>
                                </thead>
                                <tbody>
                    
                    `;
                    if(response.objets.length > 0){
                        response.objets.forEach(function(objet){

                            let photoObjet = "images/objets/default.jpg";
                            if(objet.photo){
                                photoObjet = "images/objets/" + objet.photo;
                            }

                            let boutons = boutonsActions.replaceAll("${objet.idObjet}", objet.idObjet);
                            html += `
                            <tr>
                                <td>${objet.nomObjet}</td>
                                <td>${objet.nomCategorie}</td>
                                <td>${objet.statut}</td>
                                <td>${objet.infoPlus ?? ""}</td>
                                <td>
                                    <img src="${photoObjet}"
                                    alt="Photo de ${objet.nomObjet}"
                                    class="img-thumbnail"
                                    style="width: 80px; height: 80px; object-fit: cover;">
                                </td>
                                <td>
                                    ${boutons}
                                </td>
                            </tr>
                            `;
                        });
                    } else {
                        html += `
                        <tr>
                            <td colspan="${colspan}" class="text-center">
                                Aucun objet trouvé
                            </td>
                        </tr>
                        `;
                    }

                    html += `
                                   </tbody>
                                </table>
                            </div>
                        </div>
                    `;

                    $("#contenu").html(html);
                }
            },
            error: function(xhr){

                $("#contenu").html(`
                    <div class="alert alert-danger text-center">
                        Erreur lors du chargement des objets
                    </div>
                    `);
            }
        });
    });


    // Formulaire ajout objet
    $("#btnAjouterObjet").click(function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getFormObjetData"
            }, 
            success: function(response){

                let optionsCategories="";
                response.categories.forEach(function(categorie){
                    optionsCategories += `
                    <option value="${categorie.idCategorie}">
                        ${categorie.nom}
                    </option>
                    `;
                });

                let optionsNiveaux="";
                response.niveaux.forEach(function(niveau){
                    optionsNiveaux += `
                    <option value="${niveau.idNiveau}">
                        ${niveau.nomSite} > ${niveau.nomLocal} > ${niveau.nomRangement} > ${niveau.idNiveau}
                    </option>
                    `;
                });

                let html = `
                    <div class="card shadow p-4">
                        <h2 class="text-center mb-4">Ajouter un objet</h2>

                        <form id="formAjoutObjet">

                            <div class="mb-3">
                                <label class="form-label">Nom de l'objet</label>
                                <input type="text" name="nom" class="form-control" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Catégorie</label>
                                <select name="idCategorie" class="form-control" required>
                                    ${optionsCategories}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Emplacement</label>
                                <select name="idNiveau" class="form-control" required>
                                    ${optionsNiveaux}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Statut</label>
                                <select name="statut" class="form-control">
                                    <option value="disponible">Disponible</option>
                                    <option value="prêté">Prêté</option>
                                    <option value="en réparation"> En réparation</option>
                                    <option value="hors service">Hors service</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Info rangement</label>
                                <input type="text" name="infoRangement" class="form-control">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Informations supplémentaires</label>
                                <input type="text" name="infoPlus" class="form-control">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Photo</label>
                                <input type="text" 
                                name="photo" 
                                class="form-control" 
                                placeholder="nom_image.jpg" 
                                pattern=".*\\.jpg$" 
                                title="Le fichier doit être au format .jpg">
                            </div>

                            <button type="submit" class="btn btn-primary w-100">
                                Ajouter
                            </button>
                        </form>

                        <p id="messageAjout" class="text-center mt-3 fw-bold"></p>
                    </div>
                 `;

                 $("#contenu").html(html);
            }
        });

    });

    //  FORMULAIRE OBJET 
    $(document).on("submit", "#formAjoutObjet", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=addObjet",
            success: function(response){

                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#formAjoutObjet")[0].reset();
                    $("#btnObjet").click();
                }
            },

            error:function(xhr){

                $("#messageAjout")
                .addClass("text-danger")
                .removeClass("text-success")
                .text("Erreur lors de l'ajout");
            }

        })
    });

    /****************************
     * Ajouter le clic modifier *
     ****************************/
    $(document).on("click", ".btnModifierObjet", function(){

        let idObjet = $(this).data("id");

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getObjetById",
                idObjet: idObjet 
            },

            success: function(response){
                let objet = response.objet;

                // Faire le formulaire de modification 
                let html = `
                    <div class="card shadow p-4">
                        <h2 class="text-center mb-4">Modifier un objet</h2>

                        <form id="formModifierObjet">

                            <input type="hidden" name="idObjet" value="${objet.idObjet}">

                            <div class="mb-3">
                                <label class="form-label">Nom</label>
                                <input type="text" name="nom" class="form-control" value="${objet.nom}" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Info rangement</label>
                                <input type="text" name="infoRangement" class="form-control" value="${objet.infoRangement ?? ''}">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Infos</label>
                                <input type="text" name="infoPlus" class="form-control" value="${objet.infoPlus ?? ''}">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Statut</label>
                                <select name="statut" class="form-control">
                                    <option value="disponible" ${objet.statut === "disponible" ? "selected" : ""}>Disponible</option>
                                    <option value="prêté" ${objet.statut === "prêté" ? "selected" : ""}>Prêté</option>
                                    <option value="en réparation" ${objet.statut === "en réparation" ? "selected" : ""}>En réparation</option>
                                    <option value="hors-service" ${objet.statut === "hors-service" ? "selected": ""}>Hors-service</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Photo</label>
                                <input type="text" 
                                name="photo" 
                                class="form-control" 
                                value="${objet.photo ?? ''}" 
                                pattern=".*\\.jpg$" 
                                title="Le fichier doit être au format .jpg">
                            </div>

                            <button type="submit" class="btn btn-primary w-100">
                                Modifier
                            </button>
                        </form>
                        <p id="messageModif" class="text-center mt-3 fw-bold"></p>
                    </div>
                `;
                $("#contenu").html(html);
            }


        });
    });

    /**************************************
     * Modification de l'objet dans la db *
     **************************************/
    $(document).on("submit", "#formModifierObjet", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=updateObjet",

            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnObjet").click();   
                }            },
            error: function(xhr){

                $("#messageModif")
                .addClass("text-danger")
                .removeClass("text-success")
                .text("Erreur lors de la modification.")
            }
        });
    });

    /*************************************
     * Suppression de l'objet dans la db *
     *************************************/
    $(document).on("click", ".btnSupprimerObjet", function(event){

        event.preventDefault();

        let idObjet = $(this).data("id");

        if(!confirm("Voulez-vous vraiment supprimer cet objet ?")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "deleteObjet",
                idObjet: idObjet
            },
            success: function(response){

                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnObjet").click();   
                }            
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la suppression.", false);
            }
        });
    });

    /****************************
     * AFFICHAGE DES CATEGORIES *
     ****************************/
    $("#btnCategories").click(function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getCategories"
            },

            success: function(response){
                if(response.success){
                    let btnAjouter = "";
                    let colonneActions = "";
                    let boutonsActions = "";
                    let colspan = 2;

                    if(roleUtilisateur === "admin" || roleUtilisateur === "owner"){
                        colspan = 3;
                        colonneActions = "<th>Actions</th>";
                        boutonsActions = `
                            <button class="btn btn-warning btn-sm btnModifierCategorie" data-id="\${categorie.idCategorie}">
                                Modifier
                            </button>

                            <button class="btn btn-danger btn-sm btnSupprimerCategorie" data-id="\${categorie.idCategorie}">
                                Supprimer
                            </button>
                        `;

                        btnAjouter = `
                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterCategorie">   
                                    Ajouter une catégorie
                                </button>
                            </div>
                        `;
                    }
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des catégories</h2>

                            ${btnAjouter}

                                <table class="table table-striped table-bordered">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Infos</th>
                                            ${colonneActions}
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    if(response.categories.length > 0){
                        response.categories.forEach(function(categorie){
                            let boutons = boutonsActions.replaceAll("${categorie.idCategorie}", categorie.idCategorie);
                            html += `
                                <tr>
                                    <td>${categorie.nom}</td>
                                    <td>${categorie.infoPlus ?? ""}</td>
                                    <td>
                                        ${boutons}
                                    </td>
                                </tr>
                            `;
                        });
                    } else {
                        html += `
                            <tr>
                                <td colspan="${colspan}" class="text-center">
                                    Aucune catégorie trouvée
                                </td>
                            </tr>
                        `;
                    }

                    html += `
                                </tbody>
                            </table>
                        </div>
                    `;
                    $("#contenu").html(html);

                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des catégories.", false);
            }
        });
    });

    /*************************
     * AJOUT D'UNE CATEGORIE *
     *************************/
    $(document).on("click", "#btnAjouterCategorie", function(){

        let html = `
            <div class="card shadow p-4">
                <h2 class="text-center mb-4">Ajouter une catégorie</h2>

                <form id="formAjoutCategorie">
                    <div class="mb-3">
                        <label class="form-label">Nom</label>
                        <input type="text" name="nom" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Informations</label>
                        <input type="text" name="infoPlus" class="form-control">
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        Ajouter
                    </button>
                </form>
            </div>
        `;
        $("#contenu").html(html);
    });

    $(document).on("submit", "#formAjoutCategorie", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() +"&myFunction=addCategorie",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnCategories").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de l'ajout d'une catégorie.", false);
            }
        });
    });

    /********************************
     * MODIFICATION D'UNE CATEGORIE *
     ********************************/
    $(document).on("click", ".btnModifierCategorie", function(){

        let idCategorie = $(this).data("id");

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getCategorieById",
                idCategorie: idCategorie
            },

            success: function(response){
                let cat = response.categorie;

                let html = `
                    <div class="card shadow p-4">
                        <h2 class="text-center mb-4">Modifier une catégorie</h2>
                        
                        <form id="formModifierCategorie">

                            <input type="hidden" name="idCategorie" value="${cat.idCategorie}">

                            <div class="mb-3">
                                <label class="form-label">Nom</label>
                                <input type="text" name="nom" class="form-control" value="${cat.nom}" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Informations supplémentaires</label>
                                <input type="text" name="infoPlus" class="form-control" value="${cat.infoPlus ?? ''}">
                            </div>

                            <button type="submit" class="btn btn-primary w-100 mt-3">
                                Modifier
                            </button>
                        </form>
                    </div>
                `;
                $("#contenu").html(html);
            }
        });
    });

    $(document).on("submit","#formModifierCategorie", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=updateCategorie",
            success: function(response){

                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnCategories").click();
                }
            }
        })
    })


    /*************************
     * SUPPRESSION CATEGORIE *
     *************************/
    $(document).on("click",".btnSupprimerCategorie", function(event){

        event.preventDefault();


        let idCategorie = $(this).data("id");

        if(!confirm("Voulez-vous vraiment supprimer cette catégorie ?")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "deleteCategorie",
                idCategorie: idCategorie
            },
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnCategories").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la suppression de la catégorie.",false);
            }
        });
    });


    /***********************
     * AFFICHAGE DES SITES *
     ***********************/
    $("#btnSites").click(function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction : "getSites"
            },
            success: function(response){

                if(response.success){
                    let colonneActions = "";
                    let btnAjouter = "";
                    let boutonsActions = "";

                    if(roleUtilisateur === "admin" || roleUtilisateur === "owner"){
                        colonneActions = "<th>Actions</th>";
                        boutonsActions = `
                        <td>
                            <button class="btn btn-warning btn-sm btnModifierSite" data-id="\${site.idSite}">
                                Modifier
                            </button>
                            <button class="btn btn-danger btn-sm btnSupprimerSite" data-id="\${site.idSite}">
                                Supprimer
                            </button>
                        </td>
                        `;
                        btnAjouter = `
                        <div class="text-end mb-3">
                            <button class="btn btn-primary" id="btnAjouterSite">
                                Ajouter un site
                            </button>
                        </div>
                        `;
                    }

                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des sites</h2>
                            ${btnAjouter}

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Adresse</th>
                                            <th>Code postal</th>
                                            <th>Localité</th>
                                            <th>Photo</th>
                                            ${colonneActions}
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    response.sites.forEach(function(site){
                        let photoSite = "images/sites/default.jpg";
                        let boutons = boutonsActions.replaceAll("${site.idSite}", site.idSite);
                        if(site.photo){
                            photoSite = "images/sites/" + site.photo;
                        }

                        html+= `
                            <tr>
                                <td>${site.nom}</td>
                                <td>${site.adresse ?? ""}</td>
                                <td>${site.code_postal ?? ""}</td>
                                <td>${site.localite ?? ""}</td>
                                <td><img src="${photoSite}" alt="Photo du site" class="img-thumbnail" style="max-width: 100px; max-height: 100px;"></td>
                                ${boutons}
                            </tr>
                        `;
                    });

                    html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                    $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des sites.",false);
            }

        });
    });

    /*******************
     * AJOUT D UN SITE *
     *******************/

    $(document).on("click", "#btnAjouterSite", function(event){
        event.preventDefault();

        let html = `
            <div class="card shadow p-4">
                <h2 class="text-center mb-4">Ajouter un site</h2>

                <form id="formAjoutSite">

                    <div class="mb-3">
                        <label class="form-label">Nom du site</label>
                        <input type="text" class="form-control" name="nom" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Adresse</label>
                        <input type="text" name="adresse" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Code postal</label>
                        <input type="text" name="code_postal" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Localité</label>
                        <input type="text" name="localite" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Photo</label>
                        <input type="text" name="photo" class="form-control" placeholder="nom_image.jpg" pattern=".*\\.jpg$" title="Le fichier doit être au format .jpg">
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        Ajouter
                    </button>
                </form>
            </div>
        `;
        $("#contenu").html(html);
    });

    /********************
     * ENVOI AJOUT SITE *
     ********************/

    $(document).on("submit", "#formAjoutSite", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",

            data: $(this).serialize() +"&myFunction=addSite",
            success: function(response){
                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#btnSites").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de l'ajout d'un site.", false)
            }
        });
    });

    /**************************
     * MODIFICATION D'UN SITE *
     **************************/
    $(document).on("click", ".btnModifierSite", function(event){

        event.preventDefault();

        let idSite = $(this).data("id");

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getSiteById",
                idSite: idSite
            },
            success: function(response){

                if(response.success){
                    let site = response.site;
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Modifier un site</h2>

                            <form id="formModifierSite">

                                <input type="hidden" name="idSite" value="${site.idSite}">

                                <div class="mb-3">
                                    <label class="form-label">Nom du site</label>
                                    <input type="text" name="nom" class="form-control" value="${site.nom}" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Adresse</label>
                                    <input type="text" class="form-control" name="adresse" value="${site.adresse ?? ""}">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Code postal</label>
                                    <input type="text" name="code_postal" class="form-control" value="${site.code_postal ?? ""}">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Localité</label>
                                    <input type="text" name="localite" class="form-control" value="${site.localite ?? ""}">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Photo</label>
                                    <input type="text" name="photo" class="form-control" value="${site.photo ?? ""}" pattern=".*\\.jpg$" title="Le fichier doit être au format .jpg">
                                </div>

                                <button type="submit" class="btn btn-primary w-100">
                                    Modifier
                                </button>
                            </form>
                        </div>
                    `;
                    $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message, false);
                }
            },

            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement du site.", false);
            }
        });
    });

    /*************************************
     * ENVOI DE LA MODIFICATION DU SITE *
     *************************************/
    $(document).on("submit", "#formModifierSite", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=updateSite",

            success: function(response){
                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#btnSites").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la modification du site.", false);
            }
        });
    });

    /*************************
     * SUPPRESSION D'UN SITE *
     *************************/
    $(document).on("click", ".btnSupprimerSite", function(event){
        event.preventDefault();
        
        let idSite = $(this).data("id");

        if(!confirm("Voulez-vous vraiment supprimer ce site ?")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "deleteSite",
                idSite: idSite
            },

            success: function(response){
                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#btnSites").click();
                }
            },

            error: function(xhr){
                showGlobalMessage("Erreur lors de la suppression du site.", false);
            }
        });
    });


    /************************
     * AFFICHAGE DES LOCAUX *
     ************************/
    $("#btnLocaux").click(function(event){

        event.preventDefault();

        $.ajax({
            url:"api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getLocaux"
            },

            success: function(response){

                if(response.success){
                    let colonneActions = "";
                    let btnAjouter = "";
                    let boutonsActions = "";
                    if(roleUtilisateur === "admin" || roleUtilisateur === "owner"){
                        colonneActions = "<th>Actions</th>";
                        boutonsActions = `
                            <td>
                                <button class="btn btn-warning btn-sm btnModifierLocal" data-id="\${local.idLocal}">
                                    Modifier
                                </button>
                                <button class="btn btn-danger btn-sm btnSupprimerLocal" data-id="\${local.idLocal}">
                                    Supprimer
                                </button>
                            </td>
                        `;
                        btnAjouter = `
                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterLocal">
                                    Ajouter local
                                </button>
                            </div>
                        `;
                    }
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des locaux</h2>

                            ${btnAjouter}

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">

                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Site</th>
                                            <th>Informations</th>
                                            <th>Photo</th>
                                            ${colonneActions}
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    response.locaux.forEach(function(local){

                        let photoLocal = "images/locaux/default.jpg";
                        if(local.photo){
                            photoLocal = "images/locaux/" + local.photo;
                        }
                        let boutons = boutonsActions.replaceAll("${local.idLocal}", local.idLocal);
                        html += `
                            <tr>
                                <td>${local.nomLocal}</td>
                                <td>${local.nomSite}</td>
                                <td>${local.infoLocal ?? ""}</td>
                                <td>
                                    <img src="${photoLocal}" 
                                    alt="Photo du local" 
                                    class="img-thumbnail" 
                                    style="max-width: 100px; max-height: 100px;">
                                </td>

                                ${boutons}
                            </tr>
                        `;
                    });

                    html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;

                    $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des locaux.", false);
            }
        });
    });

    /********************
     * AJOUT D'UN LOCAL *
     ********************/
    $(document).on("click", "#btnAjouterLocal", function(event){
        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data:{
                myFunction : "getSites"
            },

            success: function(response){
                if(response.success){

                    let optionsSites = "";
                    response.sites.forEach(function(site){
                        optionsSites += `
                            <option value="${site.idSite}">
                                ${site.nom}
                            </option>
                        `;
                    });
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Ajout d'un local</h2>

                            <form id="formAjoutLocal">

                                <div class="mb-3">
                                    <label class="form-label">Nom du local</label>
                                    <input type="text" name="nom" class="form-control" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Site</label>
                                    <select name="idSite" class="form-control" required>
                                        ${optionsSites}
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Informations</label>
                                    <input class="form-control" name="infoLocal" type="text">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Photo</label>
                                    <input type="text" name="photo" class="form-control" placeholder="local.jpg" pattern=".*\\.jpg$" title="Le fichier doit être au format .jpg">
                                </div>

                                <button type="submit" class="btn btn-primary w-100">
                                    Ajouter
                                </button>
                            
                            </form>
                        </div>
                    `;
                    $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message,false);
                }
            },

            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des sites.", false);
            }
        });
    });


    $(document).on("submit", "#formAjoutLocal", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=addLocal",
            success: function(response){
                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#btnLocaux").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de l'ajout du local.", false);
            }
        });
    });


    /*********************
     * MODIFIER UN LOCAL *
     *********************/
    $(document).on("click", ".btnModifierLocal", function(event){
        event.preventDefault();

        let idLocal = $(this).data("id");

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data:{
                myFunction: "getLocalById",
                idLocal: idLocal
            },
            success: function(response){

                if(response.success){
                    let local = response.local;

                    $.ajax({
                        url: "api/api.php",
                        method: "POST",
                        dataType: "json",
                        data: {
                            myFunction: "getSites"
                        },
                        success: function(responseSites){
                            let optionSites = "";
                            responseSites.sites.forEach(function(site){
                                optionSites += `
                                    <option value="${site.idSite}" 
                                        ${site.idSite == local.idSite ? "selected" : ""}>
                                        ${site.nom}
                                    </option>
                                `;
                            });
                            let html = `
                                <div class="card shadow p-4">

                                    <h2 class="text-center mb-4">
                                        Modifier un local
                                    </h2>

                                    <form id="formModifierLocal">

                                        <input type="hidden"
                                               name="idLocal"
                                               value="${local.idLocal}">
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Nom du local</label>
                                            <input type="text" 
                                                   name="nom"
                                                   class="form-control"
                                                   value="${local.nom}"
                                                   required>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Site</label>
                                            <select name="idSite"
                                                    class="form-control"
                                                    required>
                                                ${optionSites}
                                            </select>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Informations</label>
                                            <input type="text"
                                                   class="form-control"
                                                   name="infoLocal"
                                                   value="${local.infoLocal ?? ""}">
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Photo</label>
                                            <input type="text"
                                                   name="photo"
                                                   class="form-control"
                                                   value="${local.photo ?? ""}"
                                                   pattern=".*\\.jpg$"
                                                   title="Le fichier doit être au format .jpg">
                                        </div>
                                        
                                        <button type="submit"
                                                class="btn btn-primary w-100">
                                            Modifier
                                        </button>
                                    </form>
                                </div>
                            `;
                            $("#contenu").html(html);
                        } 
                    });
                }
                else {
                    showGlobalMessage(response.message, false);
                }
            },

            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement du local.", false);
            }
        });
    });

    $(document).on("submit", "#formModifierLocal", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=updateLocal",
            success: function(response){
                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#btnLocaux").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la modification du local.", false);
            }
        });
    });

    /**********************
     * SUPPRIMER UN LOCAL *
     **********************/
    $(document).on("click", ".btnSupprimerLocal", function(event){

        event.preventDefault();
        let idLocal = $(this).data("id");

        if(!confirm("Voulez-vous vraiment supprimer ce local ? ")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data:{
                myFunction: "deleteLocal",
                idLocal : idLocal
            },
            success: function(response){
                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#btnLocaux").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la suppression du local.", false);
            }
        });
    });


    /***************************
     * AFFICHER LES RANGEMENTS *
     ***************************/
    $("#btnRangements").click(function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getRangements"
            },

            success: function(response){

                if(response.success){
                    let colonneActions = "";
                    let btnAjouter = "";
                    let boutonsActions = "";
                    if(roleUtilisateur === "admin" || roleUtilisateur === "owner"){
                        colonneActions = "<th>Actions</th>";
                        boutonsActions = `
                            <td>
                                <button class="btn btn-warning btn-sm btnModifierRangement" data-id="\${rangement.idRangement}">
                                    Modifier
                                </button>
                                <button class="btn btn-danger btn-sm btnSupprimerRangement" data-id="\${rangement.idRangement}">
                                    Supprimer
                                </button>
                            </td>
                        `;
                        btnAjouter = `
                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterRangement">
                                    Ajouter un rangement
                                </button>
                            </div>
                        `;
                    }
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des rangements</h2>

                            ${btnAjouter}

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Site</th>
                                            <th>Local</th>
                                            <th>Informations</th>
                                            <th>Photo</th>
                                            ${colonneActions}
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    response.rangements.forEach(function(rangement){

                        let photoRangement = "images/rangements/default.jpg";
                        if(rangement.photo){
                            photoRangement = "images/rangements/" + rangement.photo;
                        }
                        let boutons = boutonsActions.replaceAll("${rangement.idRangement}", rangement.idRangement);
                        html += `
                            <tr>
                                <td>${rangement.nomRangement}</td>
                                <td>${rangement.nomSite}</td>
                                <td>${rangement.nomLocal}</td>
                                <td>${rangement.infoRangement ?? ""}</td>
                                <td>
                                    <img src="${photoRangement}" 
                                        alt="Photo du rangement" 
                                        class="img-thumbnail" 
                                        style="max-width: 100px; max-height: 100px;">
                                </td>

                                ${boutons}
                            </tr>
                        `;

                    });

                                            html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `;

                        $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des rangements.", false);
            }
        });
    });

    /*******************
     * AJOUT RANGEMENT *
     *******************/
    $(document).on("click", "#btnAjouterRangement", function(event){
        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType:"json",
            data:{
                myFunction: "getLocaux"
            },
            success: function(response){
                if(response.success){
                    let optionsLocaux = "";

                    response.locaux.forEach(function(local){
                        optionsLocaux += `
                            <option value="${local.idLocal}">
                                ${local.nomSite} > ${local.nomLocal}
                            </option>
                        `;
                    });

                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Ajouter un rangement</h2>

                            <form id="formAjoutRangement">

                                <div class="mb-3">
                                    <label class="form-label">Nom du rangement</label>
                                    <input type="text"
                                           name="nom"
                                           class="form-control"
                                           required>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Local</label>
                                    <select name="idLocal"
                                            class="form-control"
                                            required>
                                        ${optionsLocaux}
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Informations</label>
                                    <input type="text"
                                           name="infoRangement"
                                           class="form-control">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Photo</label>
                                    <input type="text"
                                           name="photo"
                                           class="form-control"
                                           placeholder="rangement.jpg"
                                           pattern = ".*\\.jpg$"
                                           title="Le fichier doit être au format .jpg"> 
                                </div>

                                <button type="submit" class="btn btn-primary w-100">
                                    Ajouter
                                </button>
                            </form>
                        </div>
                    `;
                    $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des locaux.", false);
            }
        });
    });

    $(document).on("submit", "#formAjoutRangement", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=addRangement",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnRangements").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de l'ajout du rangement.", false);
            }
        });
    });

    /*****************************
     * MODIFICATION DU RANGEMENT *
     *****************************/
    $(document).on("click", ".btnModifierRangement", function(event){
        event.preventDefault();

        let idRangement = $(this).data("id");

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getRangementById",
                idRangement : idRangement
            },
            success: function(response){
                if(response.success){
                    let rangement = response.rangement

                    $.ajax({
                        url: "api/api.php",
                        method: "POST",
                        dataType: "json",
                        data: {
                            myFunction: "getLocaux"
                        },
                        success: function(responseLocaux){
                            let optionsLocaux = "";
                            responseLocaux.locaux.forEach(function(local){
                                optionsLocaux += `
                                    <option value="${local.idLocal}"
                                        ${local.idLocal == rangement.idLocal ? "selected" : ""}>
                                        ${local.nomSite} > ${local.nomLocal}
                                    </option>
                                `;
                            });

                            let html= `
                                <div class="card shadow p-4">
                                    <h2 class="text-center mb-4">Modifier un rangement</h2>

                                    <form id="formModifierRangement">

                                        <input type="hidden"
                                               name="idRangement"
                                               value="${rangement.idRangement}">
                                            
                                        <div class="mb-3">
                                            <label class="form-label">Nom du rangement</label>
                                            <input type="text"
                                                   name="nom"
                                                   class="form-control"
                                                   value="${rangement.nom}"
                                                   required>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Local</label>
                                            <select name="idLocal"
                                                    class="form-control"
                                                    required>
                                                ${optionsLocaux}
                                            </select>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Informations</label>
                                            <input type="text"
                                                   class="form-control"
                                                   name="infoRangement"
                                                   value="${rangement.infoRangement ?? ""}">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Photo</label>
                                            <input type="text"
                                                   class="form-control"
                                                   name="photo"
                                                   value="${rangement.photo ?? ""}"
                                                   pattern=".*\\.jpg$"
                                                   title = "Le fichier doit être au format .jpg">
                                        </div>
                                        
                                        <button type="submit" class="btn btn-primary w-100">
                                            Modifier   
                                        </button>
                                    </form>
                                </div>
                            `;
                            $("#contenu").html(html);
                        }
                    });
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement du rangement.", false);
            }
        });
    });

    $(document).on("submit","#formModifierRangement", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=updateRangement",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnRangements").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la modification du rangement.", false);
            }
        });
    });

    /***********************
     * SUPPRIMER RANGEMENT *
     ***********************/
    $(document).on("click", ".btnSupprimerRangement", function(event){

        event.preventDefault();

        let idRangement = $(this).data("id");

        if(!confirm("Voulez-vous vraiment supprimer ce rangement ? ")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "deleteRangement",
                idRangement: idRangement
            },
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnRangements").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la suppression du rangement.", false);
            }
        });
    });

    /*************************
     * AFFICHAGE DES NIVEAUX *
     *************************/
    $("#btnNiveaux").click(function(event){
        event.preventDefault();


        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction : "getNiveaux"
            },
            success: function(response){
                if(response.success){
                    let colonneActions = "";
                    let btnAjouter = "";
                    let boutonsActions = "";
                    if(roleUtilisateur === "admin" || roleUtilisateur === "owner"){
                        colonneActions = "<th>Actions</th>";
                        boutonsActions = `
                            <td>
                                <button class="btn btn-warning btn-sm btnModifierNiveau" data-id="\${niveau.idNiveau}">
                                    Modifier
                                </button>
                                <button class="btn btn-danger btn-sm btnSupprimerNiveau" data-id="\${niveau.idNiveau}">
                                    Supprimer
                                </button>
                            </td>
                        `;
                        btnAjouter = `
                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterNiveau">
                                    Ajouter un niveau
                                </button>
                            </div>
                        `;
                    }
                    let html = `
                        <div class="card shadow p-4">

                            <h2 class="text-center mb-4">Liste des niveaux</h2>

                            ${btnAjouter}

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">

                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Site</th>
                                            <th>Local</th>
                                            <th>Rangement</th>
                                            <th>Informations</th>
                                            <th>Photo</th>
                                            ${colonneActions}
                                        </tr>
                                    </thead>

                                    <tbody>
                    `;

                    response.niveaux.forEach(function(niveau){
                        let photoNiveau = "images/niveaux/default.jpg";
                        if(niveau.photo){
                            photoNiveau = "images/niveaux/" + niveau.photo;
                        }
                        let boutons = boutonsActions.replaceAll("${niveau.idNiveau}", niveau.idNiveau);

                        html += `
                            <tr>
                                <td>${niveau.nomNiveau}</td>
                                <td>${niveau.nomSite}</td>
                                <td>${niveau.nomLocal}</td>
                                <td>${niveau.nomRangement}</td>
                                <td>${niveau.infoNiveau ?? ""}</td>
                                <td>
                                    <img src="${photoNiveau}" 
                                    alt="Photo du niveau" 
                                    class="img-thumbnail" 
                                    style="max-width: 100px; 
                                    max-height: 100px;">
                                </td>
                                ${boutons}
                            </tr>
                        `;
                    });

                    html+= `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                    $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des niveaux.", false);
            }
        });
    });

    /*********************
     * AJOUT D'UN NIVEAU *
     *********************/
    $(document).on("click", "#btnAjouterNiveau", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",

            data: {
                myFunction: "getRangements"
            },

            success: function(response){

                if(response.success){

                    let optionsRangements = "";

                    response.rangements.forEach(function(rangement){

                        optionsRangements += `
                            <option value="${rangement.idRangement}">
                                ${rangement.nomSite} >
                                ${rangement.nomLocal} >
                                ${rangement.nomRangement}
                            </option>
                        `;
                    });

                    let html = `
                        <div class="card shadow p-4">

                            <h2 class="text-center mb-4">
                                Ajouter un niveau
                            </h2>

                            <form id="formAjoutNiveau">

                                <div class="mb-3">
                                    <label class="form-label">
                                        Nom du niveau
                                    </label>

                                    <input type="text"
                                        name="nom"
                                        class="form-control"
                                        required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">
                                        Rangement
                                    </label>

                                    <select name="idRangement"
                                            class="form-control"
                                            required>

                                        ${optionsRangements}

                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">
                                        Informations
                                    </label>

                                    <input type="text"
                                        name="infoNiveau"
                                        class="form-control">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">
                                        Photo
                                    </label>

                                    <input type="text"
                                        name="photo"
                                        class="form-control"
                                        pattern=".*\\.jpg$"
                                        title="Le fichier doit être au format .jpg">
                                </div>

                                <button type="submit"
                                        class="btn btn-primary w-100">
                                    Ajouter
                                </button>

                            </form>
                        </div>
                    `;

                    $("#contenu").html(html);

                } else {
                    showGlobalMessage(response.message, false);
                }
            },

            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des rangements.", false);
            }
        });
    });

    $(document).on("submit", "#formAjoutNiveau", function(event){
        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=addNiveau",
            success: function(response){

                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnNiveaux").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de l'ajout du niveau", false);
            }
        });
    });

    /**************************
     * MODIFICATION D'UN NIVEAU *
     **************************/
    $(document).on("click", ".btnModifierNiveau", function(event){
        event.preventDefault();

        let idNiveau = $(this).data("id");

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getNiveauById",
                idNiveau : idNiveau
            },
            success: function(response){
                if(response.success){
                    let niveau = response.niveau;

                    $.ajax({
                        url: "api/api.php",
                        method: "POST",
                        dataType: "json",
                        data: {
                            myFunction: "getRangements"
                        },
                        success: function(responseRangements){
                            let optionsRangements = "";

                            responseRangements.rangements.forEach(function(rangement){
                                optionsRangements += `
                                    <option value="${rangement.idRangement}"
                                        ${rangement.idRangement == niveau.idRangement ? "selected" : ""}">
                                        ${rangement.nomSite} > ${rangement.nomLocal} > ${rangement.nomRangement}
                                    </option>
                                `;
                            });

                            let html = `
                                <div class="card shadow p-4">

                                    <h2 class="text-center mb-4">Modifier un niveau</h2>

                                    <form id="formModifierNiveau">

                                        <input type="hidden"
                                                name="idNiveau"
                                                value="${niveau.idNiveau}">
                                            
                                        <div class="mb-3">
                                            <label class="form-label">Nom du niveau</label>
                                            <input type="text"
                                                    name="nom"
                                                    value="${niveau.nom}"
                                                    class="form-control"
                                                    required>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Rangement</label>
                                            <select name="idRangement"
                                                    class="form-control"
                                                    required>
                                                ${optionsRangements}
                                            </select>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Informations</label>
                                            <input type="text"
                                                   name="infoNiveau"
                                                   class="form-control"
                                                   value="${niveau.infoNiveau ?? ""}">
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label class="form-label">Photo</label>
                                            <input type="text"
                                                   name="photo"
                                                   class="form-control"
                                                   value="${niveau.photo ?? ""}"
                                                   pattern=".*\\.jpg$"
                                                   title = "Le fichier doit être au format .jpg">
                                        </div>
                                        
                                        <button type="submit"
                                                class="btn btn-primary w-100">
                                            Modifier
                                        </button>
                                    </form>
                                </div>
                            `;
                            $("#contenu").html(html);
                        }
                    });
                } else {
                    showGlobalMessage(response.message,false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement du niveau.", false);
            }
        });
    });

    $(document).on("submit", "#formModifierNiveau", function(event){
        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=updateNiveau",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnNiveaux").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la modification du niveau", false);
            }
        })
    })

    /***************************
     * SUPPRESSION D'UN NIVEAU *
     ***************************/
    $(document).on("click", ".btnSupprimerNiveau", function(event){
        event.preventDefault();

        let idNiveau = $(this).data("id");

        if(!confirm("Voulez-vous vraiment supprimer ce niveau ?")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction : "deleteNiveau",
                idNiveau : idNiveau
            },
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnNiveaux").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("erreur lors de la suppression du niveau.", false);
            }
        });
    });


    /***********************
     * AFFICHAGE DES PRÊTS *
     ***********************/
    $("#btnPrets").click(function(event){

        event.preventDefault();

        let btnAjouterPret = "";

        if(roleUtilisateur === "admin"){
            btnAjouterPret = `
                <button class="btn btn-primary" id="btnAjouterPret">
                    Ajouter un prêt
                </button>
            `;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getPrets"
            },
            success: function(response){
                if(response.success){
                    let html = `
                        <div class="card shadow p-4">

                            <h2 class="text-center mb-4">Liste des prêts</h2>

                            <div class="text-end mb-3">
                                ${btnAjouterPret}

                                <button class="btn btn-secondary" id="btnMesPrets">
                                    Mes prêts
                                </button>

                                <button class="btn btn-secondary" id="btnHistoriquePrets">
                                    Historique des prêts
                                </button>
                            </div>

                            <div class="table-responsive">

                                <table class="table table-bordered table-striped">

                                    <thead class="table-primary">

                                        <tr>
                                            <th>Objet</th>
                                            <th>Utilisateur</th>
                                            <th>Date prêt</th>
                                            <th>Date retour prévue</th>
                                            <th>Date retour réelle</th>
                                            <th>Commentaire</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    response.prets.forEach(function(pret){

                        html += `
                            <tr>

                                <td>${pret.nomObjet}</td>
                                
                                <td>
                                    ${pret.prenomUtilisateur}
                                    ${pret.nomUtilisateur}
                                </td>

                                <td>${pret.datePret}</td>
                                <td>${pret.dateRetourPrevue ?? ""}</td>
                                <td>${pret.dateRetourReelle ?? ""}</td>
                                <td>${pret.commentaire ?? ""}</td>
                                <td>
                                    <button class="btn btn-warning btn-sm btnRetourPret" data-id="${pret.idPret}">
                                        Retour prêt
                                    </button>
                            </tr>
                        `;
                        
                    });

                    html += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `;
                        $("#contenu").html(html);
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement des prêts.", false);
            }
        });
    });


    /*****************
     * AJOUT DE PRET *
     *****************/
    $(document).on("click", "#btnAjouterPret", function(event){

        event.preventDefault();

        // Charger les obbjets
        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getObjets"
            },
            success: function(responseObjets){
                if(responseObjets.success){

                    // Charger les utilisateurs
                    $.ajax({
                        url: "api/api.php",
                        method: "POST",
                        dataType: "json",
                        data: {
                            myFunction : "getUtilisateurs"
                        },
                        success: function(responseUtilisateurs){

                            if(responseUtilisateurs.success){
                                let optionsObjets = "";

                                responseObjets.objets.forEach(function(objet){
                                    optionsObjets += `
                                        <option value="${objet.idObjet}">
                                            ${objet.nomObjet}
                                        </option>
                                    `;
                                });

                                let optionsUsers = "";

                                responseUtilisateurs.utilisateurs.forEach(function(user){
                                    optionsUsers += `
                                        <option value="${user.idUtilisateur}">
                                            ${user.prenomUtilisateur} ${user.nomUtilisateur}
                                        </option>
                                    `;
                                });

                                // Ajout du suivi de la date
                                const now = new Date();
                                const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                                .toISOString()
                                .split("T")[0];

                                let html = `
                                    <div class="card shadow p-4">

                                        <h2 class="text-center mb-4">Ajouter un prêt</h2>

                                        <form id="formAjoutPret">

                                            <div class="mb-3">
                                                <label class="form-label">Objet</label>
                                                <select name="idObjet"
                                                        class="form-control"
                                                        required>
                                                    ${optionsObjets}
                                                </select>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">Utilisateur</label>
                                                <select name="idUtilisateur"
                                                        class="form-control"
                                                        required>
                                                    ${optionsUsers}
                                                </select>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">Date retour prévue</label>
                                                <input type="date"
                                                       name="dateRetourPrevue"
                                                       class="form-control"
                                                       min="${today}">
                                            </div>
                                            
                                            <div class="mb-3">
                                                <label class="form-label">Commentaire</label>

                                                <textarea name="commentaire"
                                                          class="form-control"></textarea>
                                            </div>
                                            
                                            <button type="submit"
                                                    class="btn btn-primary w-100">
                                                Ajouter
                                            </button>
                                        </form>
                                    </div>
                                `;
                                $("#contenu").html(html);
                            } else {
                                showGlobalMessage(
                                    responseObjets.message,
                                    false
                                );
                            }
                        }
                    });
                } else{
                    showGlobalMessage(
                        responseObjets.message,
                        false
                    );
                }
            }
        });
    });

    /************************************
     * ENVOI DU BOUTON D'AJOUT DE PRÊT *
     ************************************/
    $(document).on("submit", "#formAjoutPret", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=addPret",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnPrets").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de l'ajout du prêt.", false);
            }
        });
    });

    /***************
     * RETOUR PRÊT *
     ***************/
    $(document).on("click", ".btnRetourPret", function(event){

        event.preventDefault();

        let idPret = $(this).data("id");

        if(!confirm("Confirmer le retour du prêt ?")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "retourPret",
                idPret: idPret
            },

            success: function(response){
                showGlobalMessage(response.message, response.success);
                if(response.success){
                    $("#btnPrets").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors du retour du prêt.", false);
            }
        });
    });

    /************************
     * HISTORIQUE DES PRÊTS *
     ************************/

    $(document).on("click", "#btnHistoriquePrets", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getHistoriquePrets"
            },

            success: function(response){

                if(response.success){

                    let html = `
                        <div class="card shadow p-4">

                            <h2 class="text-center mb-4">
                                Historique des prêts
                            </h2>

                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnRetourPrets">
                                    Retour aux prêts actifs
                                </button>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>Objet</th>
                                            <th>Utilisateur</th>
                                            <th>Date prêt</th>
                                            <th>Date retour prévue</th>
                                            <th>Date retour réelle</th>
                                            <th>Commentaire</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    if(response.prets.length > 0){

                        response.prets.forEach(function(pret){
                            html += `
                                <tr>
                                    <td>${pret.nomObjet}</td>
                                    <td>${pret.prenomUtilisateur} ${pret.nomUtilisateur}</td>
                                    <td>${pret.datePret}</td>
                                    <td>${pret.dateRetourPrevue ?? ""}</td>
                                    <td>${pret.dateRetourReelle ?? ""}</td>
                                    <td>${pret.commentaire ?? ""}</td>
                                </tr>
                            `;
                        });

                    } else {
                        html += `
                            <tr>
                                <td colspan="6" class="text-center">
                                    Aucun prêt dans l'historique
                                </td>
                            </tr>
                        `;
                    }

                    html += `
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;

                    $("#contenu").html(html);

                } else {
                    showGlobalMessage(response.message, false);
                }
            },

            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement de l'historique.", false);
            }
        });
    });

    $(document).on("click", "#btnRetourPrets", function(event){
        event.preventDefault();
        $("#btnPrets").click();
    });
    

    /**********************
     * RECHERCHE D'OBJETS *
     **********************/
    $(document).on("click", "#btnRechercheObjet", function(event){

        event.preventDefault();

        let html = `
            <div class="card shadow p-4">
                <h2 class="text-center mb-4">Recherche d'objets</h2>

                <form id="formRechercheObjets">
                    <div class="mb-3">
                        <label class="form-label">Nom de l'objet</label>
                        <input type="text" name="nomObjet" class="form-control">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Catégorie</label>
                        <input type="text" name="categorie" class="form-control">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Statut</label>
                        <select name="statut" class="form-control">
                            <option value="">Tous</option>
                            <option value="disponible">Disponible</option>
                            <option value="indisponible">Indisponible</option>
                            <option value="prêté">En prêt</option>
                            <option value="en réparation">En Réparation</option>
                            <option value="hors-service">Hors Service</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Site</label>
                        <input type="text" name="site" class="form-control">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Local</label>
                        <input type="text" name="local" class="form-control">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Rangement</label>
                        <input type="text" name="rangement" class="form-control">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Niveau</label>
                        <input type="text" name="niveau" class="form-control">
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        Rechercher
                    </button>
                </form>



                <div id="resultatsRecherche" class="mt-4"></div>
            </div>
        `;
        $("#contenu").html(html);
    });

    $(document).on("submit", "#formRechercheObjets", function(event){

        event.preventDefault();

            $.ajax({
                url: "api/api.php",
                method: "POST",
                dataType: "json",
                data: $(this).serialize() + "&myFunction=searchObjets",
                success: function(response){

                    if(!response.success){
                        $("#resultatsRecherche").html(`
                            <div class="alert alert-warning text-center">
                                Aucun objet trouvé.
                            </div>
                        `);
                        return;
                    }


                    let html = `
                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead class="table-primary">
                                    <tr>
                                        <th>Objet</th>
                                        <th>Catégorie</th>
                                        <th>Statut</th>
                                        <th>Site</th>
                                        <th>Local</th>
                                        <th>Rangement</th>
                                        <th>Niveau</th>
                                        <th>Infos</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

                    response.objets.forEach(function(objet){
                        html += `
                            <tr>
                                <td>${objet.nomObjet}</td>
                                <td>${objet.nomCategorie ?? ""}</td>
                                <td>${objet.statut ?? ""}</td>
                                <td>${objet.nomSite ?? ""}</td>
                                <td>${objet.nomLocal ?? ""}</td>
                                <td>${objet.nomRangement ?? ""}</td>
                                <td>${objet.nomNiveau ?? ""}</td>
                                <td>${objet.infoPlus ?? ""}</td>
                            </tr>
                        `; 
                    });

                    html += `
                                    </tbody>
                                </table>
                            </div>
                    `;
                    $("#resultatsRecherche").html(html);
                },

                error: function(xhr){
                    showGlobalMessage("Erreur lors de la recherche d'objets.", false);
                }
            });
    });

    $(document).on("click", "#btnRechercheArborescence", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getFormObjetData"
            },
            success: function(response){
                let optionsSites = "<option value=''>Tous les sites</option>";
                let optionsLocaux = "<option value=''>Tous les locaux</option>";
                let optionsRangements = "<option value=''>Tous les rangements</option>";
                let optionsNiveaux = "<option value=''>Tous les niveaux</option>";

                response.sites.forEach(function(site){

                    optionsSites += `
                        <option value="${site.idSite}">
                            ${site.nom}
                        </option>
                    `;
                });

                response.locaux.forEach(function(local){

                    optionsLocaux += `
                        <option value="${local.idLocal}">
                            ${local.nom}
                        </option>
                    `;
                });

                response.rangements.forEach(function(rangement){

                    optionsRangements += `
                        <option value="${rangement.idRangement}">
                            ${rangement.nom}
                        </option>
                    `;
                });

                response.niveaux.forEach(function(niveau){

                    optionsNiveaux += `
                        <option value="${niveau.idNiveau}">
                            ${niveau.nomNiveau}
                        </option>
                    `;
                });

                let html = `
                    <div class="card shadow p-4">

                        <h2 class="text-center mb-4">
                            Recherche par arborescence
                        </h2>

                        <form id="formRechercheArborescence">

                            <div class="mb-3">
                                <label class="form-label">Site</label>
                                <select name="idSite" class="form-control">
                                    ${optionsSites}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Local</label>
                                <select name="idLocal" class="form-control">
                                    ${optionsLocaux}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Rangement</label>
                                <select name="idRangement" class="form-control">
                                    ${optionsRangements}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Niveau</label>
                                <select name="idNiveau" class="form-control">
                                    ${optionsNiveaux}
                                </select>
                            </div>

                            <button type="submit" class="btn btn-primary w-100">
                                Rechercher
                            </button>
                        </form>

                        <div id="resultatsArborescence" class="mt-4"></div>
                    </div>
                `;
                $("#contenu").html(html);
            }
        
        });

    });

    $(document).on("submit", "#formRechercheArborescence", function(event){
        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=searchObjetsArborescence",
            success: function(response){
                if(!response.success){
                    $("#resultatsArborescence").html(`
                        <div class="alert alert-warning text-center">
                            Aucun objet trouvé.
                        </div>
                    `);
                    return;
                }

                let html = `
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">

                        <thead class="table-primary">
                            <tr>
                                <th>Objet</th>
                                <th>Catégorie</th>
                                <th>Statut</th>
                                <th>Site</th>
                                <th>Local</th>
                                <th>Rangement</th>
                                <th>Niveau</th>
                                <th>Infos</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                response.objets.forEach(function(objet){
                    html += `
                        <tr>
                            <td>${objet.nomObjet}</td>
                            <td>${objet.nomCategorie}</td>
                            <td>${objet.statut}</td>
                            <td>${objet.nomSite}</td>
                            <td>${objet.nomLocal}</td>
                            <td>${objet.nomRangement}</td>
                            <td>${objet.nomNiveau}</td>
                            <td>${objet.infoPlus}</td>
                        </tr>
                    `;
                });

                html += `
                        </tbody>
                    </table>
                </div>
                `;
                $("#resultatsArborescence").html(html);
            }
        });
    });

    /***********************
     * ADMIN : Utilisateur *
     ***********************/
$(document).on("click", "#btnAdmin", function(event){

        event.preventDefault();

        $.when(
            $.ajax({
                url: "api/api.php",
                method: "POST",
                dataType: "json",
                data: {
                    myFunction: "getStatistiquesAdmin"
                }
            }),

            $.ajax({
                url: "api/api.php",
                method: "POST",
                dataType: "json",
                data: {
                    myFunction: "getUtilisateursAdmin"
                }
            })

        ).done(function(responseStats, responseUsers){

            let statsResponse = responseStats[0];
            let usersResponse = responseUsers[0];

            if(!statsResponse.success){
                showGlobalMessage(statsResponse.message, false);
                return;
            }

            if(!usersResponse.success){
                showGlobalMessage(usersResponse.message, false);
                return;
            }

            let stats = statsResponse.stats;

            let htmlStats = `
                <div class="row mb-4">

                    <div class="col-md-3 mb-3">
                        <div class="card text-center shadow p-3">
                            <h5>Objets</h5>
                            <p class="fs-3 fw-bold">${stats.nbObjets}</p>
                        </div>
                    </div>

                    <div class="col-md-3 mb-3">
                        <div class="card text-center shadow p-3">
                            <h5>Disponibles</h5>
                            <p class="fs-3 fw-bold">${stats.nbObjetsDisponibles}</p>
                        </div>
                    </div>

                    <div class="col-md-3 mb-3">
                        <div class="card text-center shadow p-3">
                            <h5>Prêtés</h5>
                            <p class="fs-3 fw-bold">${stats.nbObjetsPretes}</p>
                        </div>
                    </div>

                    <div class="col-md-3 mb-3">
                        <div class="card text-center shadow p-3">
                            <h5>Utilisateurs</h5>
                            <p class="fs-3 fw-bold">${stats.nbUtilisateurs}</p>
                        </div>
                    </div>

                </div>
            `;

            let html = `
                <div class="card shadow p-4">
                    <h2 class="text-center mb-4">Administration</h2>

                    ${htmlStats}

                    <h3 class="text-center mb-4">Gestion des utilisateurs</h3>

                    <div class="text-end mb-3">
                        <button class="btn btn-primary" id="btnAjouterUtilisateur">
                            Ajouter un utilisateur
                        </button>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-bordered table-striped">
                            <thead class="table-primary">
                                <tr>
                                    <th>Prénom</th>
                                    <th>Nom</th>
                                    <th>Login</th>
                                    <th>Rôle</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            usersResponse.utilisateurs.forEach(function(user){
                html += `
                    <tr>
                        <td>${user.prenomUtilisateur}</td>
                        <td>${user.nomUtilisateur}</td>
                        <td>${user.login}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn btn-warning btn-sm btnModifierUtilisateur"
                                    data-id="${user.idUtilisateur}">
                                Modifier
                            </button>

                            <button class="btn btn-danger btn-sm btnSupprimerUtilisateur"
                                    data-id="${user.idUtilisateur}">
                                Supprimer
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            $("#contenu").html(html);

        }).fail(function(xhr){
            showGlobalMessage("Erreur lors du chargement de l'administration.", false);
        });
    });

    /***************************************
     * FORMULAIRE D'AJOUT D'UN UTILISATEUR *
     ***************************************/
    $(document).on("click", "#btnAjouterUtilisateur", function(event){
        event.preventDefault();

        let html = `
            <div class="card shadow p-4">
                <h2 class="text-center mb-4">Ajouter un utilisateur</h2>

                <form id="formAjoutUtilisateur">

                    <div class="mb-3">
                        <label class="form-label">nom</label>
                        <input type="text" name="nomUtilisateur" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">prénom</label>
                        <input type="text" name="prenomUtilisateur" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">login</label>
                        <input type="text" name="login" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">mot de passe</label>
                        <input type="password" name="mdp" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">confirmation du mot de passe</label>
                        <input type="password" name="mdpConfirmation" class="form-control" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">rôle</label>
                        <select name="role" class="form-control" required>
                            <option value="user">utilisateur</option>
                            <option value="admin">administrateur</option>
                            <option value="owner">propriétaire</option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-primary w-100">
                        Ajouter
                    </button>

                </form>
            </div>
        `;
        $("#contenu").html(html);
    });

    /************************************************
     * ENVOI DU FORMULAIRE D'AJOUT D'UN UTILISATEUR *
     ************************************************/
    $(document).on("submit", "#formAjoutUtilisateur", function(event){
        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: $(this).serialize() + "&myFunction=addUtilisateur",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnAdmin").click();
                }

            },  
            error: function(xhr){
                showGlobalMessage("Erreur lors de l'ajout de l'utilisateur.", false);
            }
        });
    });


    /***********************************************
     * FORMULAIRE DE MODIFICATION D'UN UTILISATEUR *
     ***********************************************/
    $(document).on("click", ".btnModifierUtilisateur", function(event){

        event.preventDefault();

        let idUtilisateur = $(this).data("id");

            $.ajax({
                url: "api/api.php",
                method: "POST",
                dataType: "json",
                data: {
                    idUtilisateur: idUtilisateur,
                    myFunction: "getUtilisateurById"
                },
                success: function(response){

                    if(!response.success){
                        showGlobalMessage(response.message, false);
                        return;
                    }

                    let utilisateur = response.utilisateur;

                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Modifier l'utilisateur</h2>

                            <form id="formModificationUtilisateur" data-id="${utilisateur.idUtilisateur}">

                                <input type="hidden" name="idUtilisateur" value="${utilisateur.idUtilisateur}">

                                <div class="mb-3">
                                    <label class="form-label">nom</label>
                                    <input type="text" name="nomUtilisateur" class="form-control" value="${utilisateur.nomUtilisateur}" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">prénom</label>
                                    <input type="text" name="prenomUtilisateur" class="form-control" value="${utilisateur.prenomUtilisateur}" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">login</label>
                                    <input type="text" name="login" class="form-control" value="${utilisateur.login}" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">mot de passe</label>
                                    <input type="password" name="mdp" class="form-control" placeholder="Laisser vide pour ne pas changer le mot de passe">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">confirmation du mot de passe</label>
                                    <input type="password" name="mdpConfirmation" class="form-control" placeholder="Laisser vide pour ne pas changer le mot de passe">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">rôle</label>
                                    <select name="role" class="form-control">
                                        <option value="user" ${utilisateur.role === "user" ? "selected" : ""}>utilisateur</option>
                                        <option value="admin" ${utilisateur.role === "admin" ? "selected" : ""}>administrateur</option>
                                        <option value="owner" ${utilisateur.role === "owner" ? "selected" : ""}>propriétaire</option>
                                    </select>
                                </div>

                                <button type="submit" class="btn btn-primary w-100">
                                    Enregistrer les modifications
                                </button>
                            </form>
                        </div>
                    `;
                    $("#contenu").html(html);
                },
                error: function(xhr){
                    showGlobalMessage("Erreur lors du chargement de l'utilisateur.", false);
                }
            });
    });

    /********************************************************
     * ENVOI DU FORMULAIRE DE MODIFICATION D'UN UTILISATEUR *
     ********************************************************/
    $(document).on("submit", "#formModificationUtilisateur", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            data: $(this).serialize() + "&myFunction=updateUtilisateur",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnAdmin").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la modification de l'utilisateur.", false);
            }
        });
    });

    /********************************
     * SUPPRESSION D'UN UTILISATEUR *
     ********************************/
    $(document).on("click", ".btnSupprimerUtilisateur", function(event){
        event.preventDefault();

        let idUtilisateur = $(this).data("id");

        if(!confirm("Confirmer la suppression de l'utilisateur ?")){
            return;
        }

        $.ajax({
            url: "api/api.php",
            method: "POST",
            data: "idUtilisateur=" + idUtilisateur + "&myFunction=deleteUtilisateur",
            success: function(response){
                showGlobalMessage(response.message, response.success);

                if(response.success){
                    $("#btnAdmin").click();
                }
            },
            error: function(xhr){
                showGlobalMessage("Erreur lors de la suppression de l'utilisateur.", false);
            }
        });
    });

    /*************************************************************************************************
     * PRÊTER DIRECTEMENT DEPUIS LA LISTE DES OBJETS (SANS PASSER PAR LE FORMULAIRE D'AJOUT DE PRÊT) *
     *************************************************************************************************/
    $(document).on("click", ".btnPreterObjet", function(event){

        event.preventDefault();

        let idObjet = $(this).data("id");

        const now = new Date();
        const today = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        )
        .toISOString()
        .split("T")[0];

        let html = `
            <div class="card shadow p-4">
                <h2 class="text-center mb-4">Prêter l'objet</h2>
                <form id="formAjoutPret">
                    <input type="hidden" name="idObjet" value="${idObjet}">

                    <div class="mb-3">
                        <label class="form-label">Date retour prévue</label>
                        <input type="date" name="dateRetourPrevue" class="form-control" min="${today}">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Commentaire</label>
                        <textarea name="commentaire" class="form-control"></textarea>
                    </div>

                    <button type="submit" class="btn btn-success w-100">
                        Valider le prêt
                    </button>
                </form>
            </div>
        `;
        $("#contenu").html(html);


    });

    /************************************************************************************
     * AFFICHAGE DES PRÊTS DE L'UTILISATEUR CONNECTÉ (LORSQU'IL CLIQUE SUR "MES PRÊTS") *
     ************************************************************************************/
    $(document).on("click", "#btnMesPrets", function(event){

        event.preventDefault();

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "getMesPrets"
            },
            success: function(response){

                if(!response.success){
                    showGlobalMessage(response.message, false);
                    return;
                }
                let html = `
                    <div class="card shadow p-4">
                        <h2 class="text-center mb-4">Mes prêts</h2>

                        <div class="table-responsive">
                            <table class="table table-bordered table-striped">
                                <thead class="table-primary">
                                    <tr>
                                        <th>Objet</th>
                                        <th>Catégorie</th>
                                        <th>Date prêt</th>
                                        <th>Date retour prévue</th>
                                        <th>Date retour réelle</th>
                                        <th>Commentaire</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;

                if(response.prets.length > 0){

                    response.prets.forEach(function(pret){
                        let action = "";

                        if(pret.dateRetourReelle === null){
                            action = `
                                <button class="btn btn-success btn-sm btnRetourPret" data-id="${pret.idPret}">
                                    Retourner le prêt
                                </button>
                            `;
                        }
                        else {
                            action = `
                                <span class="text-success">
                                    Prêt retourné
                                </span>
                            `;
                        }

                        html += `
                            <tr>
                                <td>${pret.nomObjet}</td>
                                <td>${pret.nomCategorie}</td>
                                <td>${pret.datePret}</td>
                                <td>${pret.dateRetourPrevue}</td>
                                <td>${pret.dateRetourReelle || "Non retourné"}</td>
                                <td>${pret.commentaire}</td>
                                <td>${action}</td>
                            </tr>
                        `;
                    });

                } else {
                    html += `
                        <tr>
                            <td colspan="7" class="text-center">
                                Vous n'avez aucun prêt.
                            </td>
                        </tr>
                    `;
                }

                html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                $("#contenu").html(html);

            },

            error: function(xhr){
                showGlobalMessage("Erreur lors du chargement de vos prêts.", false);
            }
        });
    });

});