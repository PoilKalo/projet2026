// quand la page est chargé
$(document).ready(function(){

    // lorsqu'on submit le formulaire
    $("#form_login").submit(function(event){

        // empêche le rechargement de la page
        event.preventDefault();

        // AJAX 
        $.ajax({
            url: "api/api.php",
            method: "POST",
            dataType: "json",
            data: {
                myFunction: "login",
                login: $("input[name='login']").val(),
                mdp: $("input[name='mdp']").val()
            },

            success: function(response){

                if(response.success){

                    $("#message")
                    .removeClass("text-danger")
                    .addClass("text-success")
                    .text(response.message);

                    // redirection après une seconde
                    setTimeout(function(){
                        window.location.href='index.html';
                    },1000);
                }
                else {
                    $("#message")
                    .removeClass("text-success")
                    .addClass("text-danger")
                    .text(response.message);
                }
            },

            error: function(){
                $("#message")
                .removeClass("text-success")
                .addClass("text-danger")
                .text("Erreur serveur.");
            }
        })
    });
});