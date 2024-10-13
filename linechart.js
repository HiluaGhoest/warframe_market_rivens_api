let chart;
let chartData = {};
let _price_array = {};
let _index = 0;
let colors = {};

// Initialize the prices array
_price_array = {};

// Load chart data from localStorage
if (localStorage.getItem('chartData')) {
  chartData = JSON.parse(localStorage.getItem('chartData'));
  _price_array = chartData._price_array;
  colors = chartData.colors;
}

// Play a sound effect
function playSound(soundUrl) {
  var audio = new Audio(soundUrl);
  audio.play();
}

window.addEventListener('load', function() {
  console.log('Chart initialized');
  const ctx = document.getElementById("lineChart").getContext('2d');

  chart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: Object.keys(_price_array).map((weapon) => {
        return {
          label: weapon,
          data: _price_array[weapon],
          borderColor: colors[weapon],
          backgroundColor: colors[weapon],
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 2,
          pointBackgroundColor: colors[weapon], // Add this line to fill the dots
        };
      })
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
  if (_price_array[weapon] && _price_array[weapon].length >= 50) {
    _price_array[weapon].shift();
  }

  return _price_array[weapon] || [];
}

window.addEventListener('lowestPriceUpdate', (event) => {
  const { weapon, _previousLowestPrice, price, timestamp } = event.detail;
  console.log(_previousLowestPrice);

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
          backgroundColor: colors[weapon],
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 2,
          pointBackgroundColor: colors[weapon], // Add this line to fill the dots
      };
  });

  // Save chart data to localStorage
  chartData = {
    _price_array: _price_array,
    colors: colors
  };
  localStorage.setItem('chartData', JSON.stringify(chartData));

  // Show the popup
  showPopup(weapon, price, _previousLowestPrice);

  // Call updateChart to refresh all weapons' data
  updateChart();
});

// Function to show the popup
function showPopup(weapon, price, previousPrice) {
  
  const popup = document.createElement('div');
  
    popup.innerHTML = `
        <div id="priceChangePopup" position:fixed; top:20px; right:80%; background-color:rgba(0, 0, 0, 0.8); padding:10px; border-radius:5px; z-index:1000;">
          <p>Price changed: ${weapon}</p>
          <br>
          <div id="popupPriceWrapper">
            <p id="price_popup_text">New price: ${price}</p>
            <img src="images/platinum.webp" style="width: 10%;">
          </div>
        </div>
    `
    document.getElementById("popupWrapper").appendChild(popup);
  if (previousPrice !== null) {
    if (price > previousPrice) {
      document.getElementById("price_popup_text").style.color = "red";
      playSound('audio/raise.mp3');
    } else if (price < previousPrice) {
      document.getElementById("price_popup_text").style.color = "green";
      playSound('audio/drop.mp3');
    }
  }

    popup.style.opacity = "1"

    // Hide the popup after 4 seconds
    setTimeout(() => {
      popup.remove();
    }, 4000);
}

function updateChart() {
  // Update the chart
  chart.update();
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

        // Remove the weapon from the chart data
        delete _price_array[weaponToRemove];
        delete colors[weaponToRemove];

        // Save chart data to localStorage
        chartData = {
          _price_array: _price_array,
          colors: colors
        };
        localStorage.setItem('chartData ', JSON.stringify(chartData));
    }
});