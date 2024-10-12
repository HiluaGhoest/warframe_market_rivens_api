let chart;
let chartData = {};
let _price_array = {};
let _index = 0;
let colors = {};

// Initialize the prices array
_price_array = {};

window.addEventListener('load', function() {
  console.log('Chart initialized');
  const ctx = document.getElementById("lineChart").getContext('2d');

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: []
    },
    options: {
      scales: {
        xAxes: [{
          type: 'time',
          unit: 'hour',
          time: {
            unit: 'hour',
            displayFormats: {
              hour: 'HH:mm'
            }
          }
        }],
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      },
      responsive: true,
      animation: false
    }
  });
});

function getPrices(weapon) {
  // If the array is full, remove the first element
  if (_price_array[weapon] && _price_array[weapon].length >= 24) {
    _price_array[weapon].shift();
  }

  return _price_array[weapon] || [];
}

window.addEventListener('lowestPriceUpdate', (event) => {
    const { weapon, price, timestamp } = event.detail;
    console.log(`Lowest price for ${weapon}: ${price} at ${timestamp}`);
  
    // Parse the timestamp using moment
    const momentTime = moment(timestamp);
    const formattedTime = momentTime.format('HH:mm A');
  
    // Add the price to the chartData
    if (!_price_array[weapon]) {
      _price_array[weapon] = [];
      colors[weapon] = getRandomColor();
    }
    _price_array[weapon].push({ x: momentTime, y: price });
  
    // Update the chart data
    chart.data.datasets = Object.keys(_price_array).map((weapon) => {
      return {
        label: weapon,
        data: _price_array[weapon],
        borderColor: colors[weapon],
        fill: false
      };
    });
    chart.update();
  });

function updateChart(lowestValues) {
  if (lowestValues) {
    console.log('Updating chart');
    // Update the chart
    chart.update();
  }
}

let index = 0;

let priceHistory = {};

// Function to generate a random color
function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      // Favor darker colors by biasing the random selection towards lower values
      let randomIndex = Math.floor(Math.random() * 16);
      if (randomIndex < 8) {
        randomIndex = Math.floor(Math.random() * 8); // Re-roll for a darker value
      }
      color += letters[randomIndex];
    }
    return color;
  }

window.addEventListener('removeWeaponFromGraph', function(event) {
    const weaponToRemove = event.detail.weapon;
    
    // Find the index of the dataset to remove
    const datasetIndex = chart.data.datasets.findIndex(dataset => dataset.label.toLowerCase().replace(/ /g, '_') === weaponToRemove);
    
    if (datasetIndex !== -1) {
        // Remove the dataset
        chart.data.datasets.splice(datasetIndex, 1);
        
        // Update the chart
        chart.update();
    }
});