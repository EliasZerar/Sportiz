//récupérer les éléments de sports.json avec fetch pour avoir le sport, la description, l'image
//mettre chaque analogie dans chaque section
fetch('sports.json')
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        console.log(data);

        // Récupérer toutes les sections
        const sections = document.querySelectorAll('.section');

        data.forEach((element, index) => {
            if (index < sections.length) {
                const section = sections[index];

                // Appliquer l'image en tant que background
                section.style.backgroundImage = `url(${element.image})`;
                section.style.backgroundRepeat = 'no-repeat';
                section.style.backgroundSize = 'cover';
                section.style.backgroundPosition = 'center';

                // Ajouter le contenu textuel
                section.innerHTML = `
                    <div class="content">
                        <h2 class="sport-name ${element.id}-title">${element.sport}</h2>
                        <p class="description">${element.description}</p>
                    </div>
                `;
            }
        });
    })
    .catch(function (error) {
        console.error('Erreur lors du chargement des données :', error);
    });