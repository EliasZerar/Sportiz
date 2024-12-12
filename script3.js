//récupérer les éléments de sports.json avec fetch pour avoir le sport, la description, l'image
//mettre chaque analogie dans chaque section
fetch('sports.json')
    .then(response => response.json())
    .then(data => {
        const sections = document.querySelectorAll('.section');

        data.forEach((element, index) => {
            if (index < sections.length) {
                const section = sections[index];

                // Créer le contenu textuel
                const contentDiv = document.createElement('div');
                contentDiv.className = 'content';
                contentDiv.innerHTML = `
                    <h2 class="sport-name ${element.id}-title">${element.sport}</h2>
                    <p class="description">${element.description}</p>
                `;

                // Créer le conteneur du graphique s'il existe déjà
                const doughnutDiv = section.querySelector('.doughnut') || document.createElement('div');
                doughnutDiv.className = 'doughnut';

                // Ajouter les deux divs à la section
                section.appendChild(contentDiv);
                section.appendChild(doughnutDiv); // S'assure que le graphique est après le contenu

                // Appliquer l'image en tant que background si nécessaire
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
