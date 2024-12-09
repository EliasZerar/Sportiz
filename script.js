
// Obtenir les éléments popup et les liens
var popupContact = document.getElementById("popupContact");
var popupLegal = document.getElementById("popupLegal");
var openPopupContact = document.getElementById("openPopupContact");
var openPopupLegal = document.getElementById("openPopupLegal");
var closeButtons = document.querySelectorAll(".close");

// Lorsque l'utilisateur clique sur "Contact", afficher le popupContact
openPopupContact.onclick = function(event) {
    event.preventDefault(); // Empêcher le comportement par défaut du lien
    popupContact.style.display = "block";
}

// Lorsque l'utilisateur clique sur "Mentions légales", afficher le popupLegal
openPopupLegal.onclick = function(event) {
    event.preventDefault();
    popupLegal.style.display = "block";
}

// Lorsque l'utilisateur clique sur la croix pour fermer le popup
closeButtons.forEach(function(button) {
    button.onclick = function() {
        popupContact.style.display = "none";
        popupLegal.style.display = "none";
    }
});

// Lorsque l'utilisateur clique en dehors du popup, le fermer
window.onclick = function(event) {
    if (event.target === popupContact) {
        popupContact.style.display = "none";
    }
    if (event.target === popupLegal) {
        popupLegal.style.display = "none";
    }
}
