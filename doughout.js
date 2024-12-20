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
    "Football": ['rgba(206, 189, 96, 1)', 'rgba(255, 255, 255, 0.9)'],
    "Tennis": ['rgba(143, 41, 41, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Equitation": ['rgba(255, 255, 255, 0.8)', 'rgba(111, 75, 56, 0.9)'],
    "Judo": ['rgba(28, 57, 149, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Basketball": ['rgba(83, 60, 128, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Handball": ['rgba(164, 98, 62, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Golf": ['rgba(154, 40, 40, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Rugby": ['rgba(154, 40, 40, 0.9)', 'rgba(255, 255, 255, 0.8)'],
    "Gymnastique": ['rgba(255, 255, 255, 0.8)', 'rgba(165, 107, 129, 0.9)'],
    "Natation": ['rgba(255, 255, 255, 0.8)', 'rgba(57, 75, 119, 0.9)'],
    "Athletisme": ['rgba(78, 135, 106, 0.9)', 'rgba(255, 255, 255, 0.8)'],
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
                    position: 'bottom',
                    labels: {
                        color: '#fff' ,
                        font: {
                            family: '"HelveticaNeue", sans-serif',  // Police de la légende
                            size: 14,  // Taille de la police
                            style: 'bold',  // Style de la police (gras)
                        },
                        usePointStyle: true, // Permet de contrôler le style du point
                        boxWidth: 30,  // Largeur de la case du point dans la légende
                        borderRadius: 30,
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
                        size: 14,
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
                    text: `Pourcentage de licenciés (${years.join(', ')})`,
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
