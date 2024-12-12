async function fetchJSONData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data.data;
}

function getSportData(sportsData, sportIndex) {
    const sportData = sportsData[sportIndex];
    const labels = sportData.distribution.map(item => item.label);
    const values = sportData.distribution.map(item => item.value);
    return { labels, values, sport: sportData.sport };
}

function createChart(chartId, labels, values, years) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Distribution des genres',
                data: values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    enabled: true
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
        const { labels, values, sport } = getSportData(sportsData, index);
        const years = sportData.annees; // Récupère les années depuis les données
        const chartId = `doughnutChart${sport}`; // Génère l'ID dynamiquement à partir du sport

        // Vérifiez si un élément HTML avec cet ID existe
        if (document.getElementById(chartId)) {
            createChart(chartId, labels, values, years);
        } else {
            console.warn(`Element with ID ${chartId} not found. Skipping chart for ${sport}.`);
        }
    });
}


createCharts();
