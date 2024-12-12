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
    
    // Inverser les données tout en maintenant l'ordre visuel du graphique
    const reversedLabels = [labels[1], labels[0]]; // Hommes et Femmes
    const reversedValues = [values[1], values[0]]; // Inverser les valeurs tout en maintenant l'ordre visuel
    
    return { labels: reversedLabels, values: reversedValues, sport: sportData.sport, total }; // Ajouter le total
}

function createChart(chartId, labels, values, years, total) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribution des genres',
                data: values,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Bleu pour Hommes (gauche)
                    'rgba(255, 99, 132, 0.6)'  // Rose pour Femmes (droite)
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',  // Bleu pour Hommes
                    'rgba(255, 99, 132, 1)'   // Rose pour Femmes
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            animation: false, // Désactiver l'animation
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(tooltipItem) {
                            const value = tooltipItem.raw; // Récupère la valeur brute
                            const percentage = ((value / total) * 100).toFixed(1); // Calcul du pourcentage
                            return `${percentage}%`; // Affiche uniquement le pourcentage
                        }
                    }
                },
                title: {
                    display: true,
                    text: `Saison : ${years.join(', ')}`
                }
            }
        }
    });
}


async function createCharts() {
    const sportsData = await fetchJSONData('statistique.json');

    sportsData.forEach((sportData, index) => {
        const { labels, values, sport, total } = getSportData(sportsData, index);
        const years = sportData.annees; // Récupère les années depuis les données
        const chartId = `doughnutChart${sport}`; // Génère l'ID dynamiquement à partir du sport

        // Vérifiez si un élément HTML avec cet ID existe
        if (document.getElementById(chartId)) {
            createChart(chartId, labels, values, years, total);
        } else {
            console.warn(`Element with ID ${chartId} not found. Skipping chart for ${sport}.`);
        }
    });
}

createCharts();
