$(document).ready(function(){

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
                    let html = `
                    <div class="card shadow p-4">
                        <h2 class="text-center mb-4">Liste des objets</h2>
                        
                        <div class="table-responsive"> 
                            <table class="table table-striped table-bordered">
                                <thead class="table-primary">
                                    <tr>
                                        <th>Nom</th>
                                        <th>Catégorie</th>
                                        <th>Statuts</th>
                                        <th>Infos</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                    
                    `;
                    if(response.objets.length > 0){
                        response.objets.forEach(function(objet){
                            html += `
                            <tr>
                                <td>${objet.nomObjet}</td>
                                <td>${objet.nomCategorie}</td>
                                <td>${objet.statut}</td>
                                <td>${objet.infoPlus ?? ""}</td>
                                <td>
                                    <button class="btn btn-warning btn-sm btnModifierObjet" data-id="${objet.idObjet}">
                                        Modifier
                                    </button>

                                    <button class="btn btn-danger btn-sm btnSupprimerObjet" data-id="${objet.idObjet}">
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                            `;
                        });
                    } else {
                        html += `
                        <tr>
                            <td colspan="4" class="text-center">
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
                console.log(xhr.responseText);

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

    // ENVOIE FORMULAIRE OBJET 
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
                console.log(xhr.responseText);

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

                            <button type="submit" class="btn btn-primary w-100">
                                Modifier
                            </button>
                        </form>
                        <p id="messageModif" class="text-center mt-3 fw-bold"></p>
                    </div>
                `;
                $("#contenu").html(html);
            },

            error: function(xhr){
                console.log(xhr.responseText)
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
                console.log(xhr.responseText);

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
                console.log(xhr.responseText);
                alert("Erreur lors de la suppression.");
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
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des catégories</h2>

                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterCategorie">
                                    Ajouter une catégorie
                                </button>
                            </div>

                                <table class="table table-striped table-bordered">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Infos</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    if(response.categories.length > 0){
                        response.categories.forEach(function(categorie){
                            html += `
                                <tr>
                                    <td>${categorie.nom}</td>
                                    <td>${categorie.infoPlus ?? ""}</td>
                                    <td>
                                        <button class="btn btn-warning btn-sm btnModifierCategorie" data-id="${categorie.idCategorie}">
                                            Modifier
                                        </button>

                                        <button class="btn btn-danger btn-sm btnSupprimerCategorie" data-id="${categorie.idCategorie}">
                                            Supprimer
                                        </button>
                                    </td>
                                </tr>
                            `;
                        });
                    } else {
                        html += `
                            <tr>
                                <td collspan="2" class="text-center">
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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

        console.log("Bouton supprimé cliqué");

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
                console.log(xhr.responseText);
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
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des sites</h2>
                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterSite">
                                    Ajouter un site
                                </button>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Adresse</th>
                                            <th>Code postal</th>
                                            <th>Localite</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    response.sites.forEach(function(site){

                        html+= `
                            <tr>
                                <td>${site.nom}</td>
                                <td>${site.adresse ?? ""}</td>
                                <td>${site.code_postal ?? ""}</td>
                                <td>${site.localite ?? ""}</td>
                                <td>
                                    <button class="btn btn-warning btn-sm btnModifierSite" data-id ="${site.idSite}">
                                        Modifier
                                    </button>
                                    <button class="btn btn-danger btn-sm btnSupprimerSite" data-id="${site.idSite}">
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
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                console.log(xhr.responseText);
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
                        <label class="form-label">Localite</label>
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
                showGlobalMessage("Erreur lors du chargement du site.", false);
            }
        });
    });

    /*************************************
     * ENVOIE DE LA MODIFICATION DU SITE *
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des locaux</h2>

                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterLocal">
                                    Ajouter local
                                </button>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">

                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Site</th>
                                            <th>Informations</th>
                                            <th>Photo</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    response.locaux.forEach(function(local){
                        html += `
                            <tr>
                                <td>${local.nomLocal}</td>
                                <td>${local.nomSite}</td>
                                <td>${local.infoLocal ?? ""}</td>
                                <td>${local.photo ?? ""}</td>

                                <td>
                                    <button class="btn btn-warning btn-sm btnModifierLocal" data-id="${local.idLocal}">
                                        Modifier
                                    </button>

                                    <button class="btn btn-danger btn-sm btnSupprimerLocal" data-id="${local.idLocal}">
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
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                console.log(xhr.responseText);
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
                                    <label class="form-label">Infomations</label>
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                                    <option value=${site.idSite}" 
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                    let html = `
                        <div class="card shadow p-4">
                            <h2 class="text-center mb-4">Liste des rangements</h2>

                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterRangement">
                                    Ajouter un rangement 
                                </button>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-striped table-bordered">
                                    <thead class="table-primary">
                                        <tr>
                                            <th>Nom</th>
                                            <th>Site</th>
                                            <th>Local</th>
                                            <th>Informations</th>
                                            <th>Photo</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                    `;

                    response.rangements.forEach(function(rangement){
                        html += `
                            <tr>
                                <td>${rangement.nomRangement}</td>
                                <td>${rangement.nomSite}</td>
                                <td>${rangement.nomLocal}</td>
                                <td>${rangement.infoRangement ?? ""}</td>
                                <td>${rangement.photo ?? ""}</td>

                                <td>
                                    <button class="btn btn-warning btn-sm btnModifierRangement" data-id="${rangement.idRangement}">
                                        Modifier
                                    </button>
                                    <button class="btn btn-danger btn-sm btnSupprimerRangement" data-id="${rangement.idRangement}">
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
                } else {
                    showGlobalMessage(response.message, false);
                }
            },
            error: function(xhr){
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
                showGlobalMessage("Erreur lors de la suppression du rangement.", false);
            }
        });
    });

    /*************************
     * AFFICHAGE DES NIVEAUX *
     *************************/
    $("#btnNiveaux").click(function(event){
        event.preventDefault();

        console.log("ok");

        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction : "getNiveaux"
            },
            success: function(response){
                if(response.success){
                    let html = `
                        <div class="card shadow p-4">

                            <h2 class="text-center mb-4">Liste des niveaux</h2>

                            <div class="text-end mb-3">
                                <button class="btn btn-primary" id="btnAjouterNiveau">
                                    Ajouter un niveau
                                </button>
                            </div>

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
                                            <th>Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                    `;

                    response.niveaux.forEach(function(niveau){

                        html += `
                            <tr>
                                <td>${niveau.nomNiveau}</td>
                                <td>${niveau.nomSite}</td>
                                <td>${niveau.nomLocal}</td>
                                <td>${niveau.nomRangement}</td>
                                <td>${niveau.infoNiveau ?? ""}</td>
                                <td>${niveau.photo ?? ""}</td>
                                <td>
                                    <button class="btn btn-warning btn-sm btnModifierNiveau" data-id="${niveau.idNiveau}">
                                        Modifier
                                    </button>
                                    
                                    <button class="btn btn-danger btn-sm btnSupprimerNiveau" data-id="${niveau.idNiveau}">
                                        Supprimer
                                    </button>
                                </td>
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);

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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
                showGlobalMessage("erreur lors de la suppression du niveau.", false);
            }
        });
    });


    /***********************
     * AFFICHAGE DES PRÊTS *
     ***********************/
    $("#btnPrets").click(function(event){

        event.preventDefault();

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
                                <button class="btn btn-primary" id="btnAjouterPret">
                                    Ajouter un prêt
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
                console.log(xhr.responseText);
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
     * ENVOIE DU BOUTON D'AJOUT DE PRÊT *
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
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
                console.log(xhr.responseText);
                showGlobalMessage("Erreur lors du chargement de l'historique.", false);
            }
        });
    });

    $(document).on("click", "#btnRetourPrets", function(event){
        event.preventDefault();
        $("#btnPrets").click();
    });
    

});