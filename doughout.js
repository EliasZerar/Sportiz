async function fetchJSONData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data.data;
}

function getSportData(sportsData, sportIndex) {
    const sportData = sportsData[sportIndex];
    const labels = sportData.distribution.map(item => item.label);
    const values = sportData.distribution.map(item => item.value);
    const percentages = sportData.distribution.map(item => item.percentage); // Récupérer les pourcentages
    return { labels, values, percentages, sport: sportData.sport };
}


const colors = {
    "Football": ['rgba(255, 99, 132, 0.6)', 'rgba(206, 189, 96, 0.6)'],
    "Tennis": ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
    "Equitation": ['rgba(255, 159, 64, 0.6)', 'rgba(255, 205, 86, 0.6)'],
    "Judo": ['rgba(201, 203, 207, 0.6)', 'rgba(54, 162, 235, 0.6)'],
    "Basketball": ['rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'],
    "Handball": ['rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
    "Golf": ['rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
    "Rugby": ['rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
    "Gymnastique": ['rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
    "Natation": ['rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
    "Athletisme": ['rgba(255, 159, 64, 0.6)', 'rgba(153, 102, 255, 0.6)'],
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
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(tooltipItem, data) {
                            const percentage = percentages[tooltipItem.dataIndex];
                            return ` ${percentage}%`;
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
