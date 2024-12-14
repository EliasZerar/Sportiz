document.addEventListener("DOMContentLoaded", function() {
    fetch('sports.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(element => {
                const section = document.getElementById(element.id);
                if (section) {
                    const contentDiv = section.querySelector('.content');
                    if (contentDiv) {
                        contentDiv.innerHTML = `
                            <h2 class="sport-name ${element.id}-title">${element.sport}</h2>
                            <p class="description">${element.description}</p>
                        `;
                    }
                    section.style.backgroundImage = `url(${element.image})`;
                    section.style.backgroundRepeat = 'no-repeat';
                    section.style.backgroundSize = 'cover';
                    section.style.backgroundPosition = 'center';
                }
            });
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données :', error);
        });
});
