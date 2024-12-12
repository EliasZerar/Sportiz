async function fetchJSONData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data.data;
}

function getSportData(sportsData, sportIndex) {
    const sportData = sportsData[sportIndex];
    const total = sportData.distribution.reduce((sum, item) => sum + item.value, 0); // Calculer le total
    const labels = sportData.distribution.map(item => item.label);
    const values = sportData.distribution.map(item => item.value);
    const percentages = sportData.distribution.map(item => item.percentage); // Récupérer les pourcentages
    return { labels, values, percentages, sport: sportData.sport };
}

const colors = {
    "Football": ['rgba(255, 255, 255, 0.9)', 'rgba(206, 189, 96, 1)'],
    "Tennis": ['rgba(255, 255, 255, 0.8)', 'rgba(143, 41, 41, 0.9)'],
    "Equitation": ['rgba(111, 75, 56, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Judo": ['rgba(255, 255, 255, 0.8)', 'rgba(28, 57, 149, 0.9)'],
    "Basketball": ['rgba(255, 255, 255, 0.8)', 'rgba(83, 60, 128, 0.9)'],
    "Handball": ['rgba(255, 255, 255, 0.8)', 'rgba(164, 98, 62, 0.9)'],
    "Golf": ['rgba(255, 255, 255, 0.8)', 'rgba(154, 40, 40, 0.9)'],
    "Rugby": ['rgba(255, 255, 255, 0.8)', 'rgba(154, 40, 40, 0.9)'],
    "Gymnastique": ['rgba(165, 107, 129, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Natation": ['rgba(57, 75, 119, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Athletisme": ['rgba(255, 255, 255, 0.8)', 'rgba(78, 135, 106, 0.9)'],
};

function createChart(chartId, labels, values, percentages, sport, years) {
    const ctx = document.getElementById(chartId).getContext('2d');
    const sportColors = colors[sport] || ['rgba(201, 203, 207, 0.6)', 'rgba(54, 162, 235, 0.6)'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: sportColors,
                borderColor: sportColors.map(color => color.replace('0.6', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            animation: false, // Désactiver l'animation
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff' ,
                        font: {
                            family: '"HelveticaNeue", sans-serif',  // Police de la légende
                            size: 14,  // Taille de la police
                            style: 'bold',  // Style de la police (gras)
                           // Couleur du texte de la légende (blanc)
                        },
                        // Ajouter `usePointStyle` et `boxWidth` pour éviter d'autres styles conflictuels
                        usePointStyle: true, // Permet de contrôler le style du point
                        boxWidth: 20,  // Largeur de la case du point dans la légende
                    }
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(tooltipItem, data) {
                            const percentage = percentages[tooltipItem.dataIndex];
                            return ` ${percentage}%`;
                        }
                    },
                    titleFont: {
                        family: '"HelveticaNeue", sans-serif', 
                        size: 12,
                        color: '#fff'  // Couleur du titre du tooltip (blanc)
                    },
                    bodyFont: {
                        family: '"HelveticaNeue", sans-serif', 
                        size: 14,
                        color: '#fff'  // Couleur du corps du tooltip (blanc)
                    }
                },
                title: {
                    display: true,
                    text: `Nombre de licenciés : saison ${years.join(', ')}`,
                    font: {
                        family: '"HelveticaNeue", sans-serif',
                        size: 14
                    },
                    color: "#fff"  // Couleur du titre du graphique (blanc)
                }
            }
        }
    });
}
async function createCharts() {
    const sportsData = await fetchJSONData('stats-sexe.json');

    sportsData.forEach((sportData, index) => {
        const { labels, values, percentages, sport } = getSportData(sportsData, index);
        const years = sportData.annees;
        const chartId = `doughnutChart${sport.replace(/\s/g, '')}`;
        if (document.getElementById(chartId)) {
            createChart(chartId, labels, values, percentages, sport, years);
        }
    });
}

createCharts();
