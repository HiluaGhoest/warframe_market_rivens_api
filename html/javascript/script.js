const { app, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const path = require('path');
let NewWeapon;

let _prices_array = {}; // Object to hold prices for each weapon
const _previousLowestPrices = {};
// Array para armazenar as armas do dashboard
let dashboardWeapons = [];

// Request the current window (or simply proceed with your logic)
document.addEventListener('DOMContentLoaded', () => {
    
        // Equivalent to loading weapons when the window is ready
        loadWeaponsFromLocalStorage();
        writeJSONweapons();
        window.showWeapons();
});

// Function to set a value in local storage
function setLocalStorage(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).getTime();
    localStorage.setItem(name, JSON.stringify({ value, expires }));
}


// Function to get a value from local storage
function getLocalStorage(name) {

    const item = localStorage.getItem(name);
    if (item) {
        const { value, expires } = JSON.parse(item);
        if (expires > Date.now()) {
            return value;
        } else {
            localStorage.removeItem(name);
        }
    }
    return null;
}

// Function to remove a value from local storage
function removeLocalStorage(name) {
    localStorage.removeItem(name);
}

async function writeJSONweapons() {
    
    const weaponsResponse = await fetchRivenData();
    console.log(weaponsResponse);
    const weaponsData = await weaponsResponse;
    const weapons = weaponsData.payload.items;
    
    // Extract only the url_name of each weapon
    const weaponNamesToJson = weapons.map(weapon => weapon.url_name);

    const weaponsFilePath = path.join(await ipcRenderer.invoke('get-user-data-path'), 'weapons.json');    // Write the weapons array to a JSON file
    
    await fs.writeFile(weaponsFilePath, JSON.stringify(weaponNamesToJson, null, 2));
    console.log('Weapons data written to weapons.json');

}

// Function to get all weapon names from local storage
async function getWeaponNamesFromLocalStorage() {

    const weaponNames = getLocalStorage('weapon_names');
    return weaponNames ? weaponNames.split(',') : [];
}

// Function to fetch auctions based on weapon name
async function fetchAuctions() {
    showLoadingIcon();
    const weapon_name = document.querySelector('.weapon').value.toLowerCase().replace(/ /g, '_');
    inFile = await checkWeaponNameInFile(weapon_name);
    if (!inFile) { 
        hideLoadingIcon();
        return;
    } else {

        try {
            const response = await fetchRivenData(weapon_name);
            if (response.error) {
                throw new Error('Network response was not ok');
            }
            const data = await response;
            displayAuctions(data.payload, weapon_name);
    
            window.dispatchEvent(new Event('load'));
        } catch (error) {
            console.error('Error fetching data:', error);
            document.getElementById('auction-results').innerHTML = '<p>API is on cooldown, please run start_server.bat if not already.</p>';
        } finally {
            hideLoadingIcon();
        }
    }

}

// Function to display auctions
function displayAuctions(data, weapon_name) {
    const auctionResults = document.getElementById('auction-results');

    // Clear previous results
    auctionResults.innerHTML = '';

    // Initialize prices array for the current weapon if not already created
    if (!_prices_array[weapon_name]) {
        _prices_array[weapon_name] = [];
    }

    // Calculate average price
    let totalPrice = 0;
    let count = 0;

    // Check if data is defined and contains auctions
    if (!data || !data.auctions || !Array.isArray(data.auctions) || data.auctions.length === 0) {
        auctionResults.innerHTML = '<p>No auctions found.</p>';
        return;
    }

    data.auctions.forEach(auction => {
        // Check if the seller is online
        if (auction.owner?.last_seen !== null) {
            const isOnline = auction.owner.status === 'ingame'; // Assuming 'online' is how online status is defined
            if (!isOnline) {
                return; // Skip this auction if the owner is not online
            }
        }

        // Include this auction in the calculations
        if (count < 5) { // Sum up the prices
            totalPrice += auction.buyout_price;
            _prices_array[weapon_name].push(auction.buyout_price); // Store the price in the corresponding array
        }

        count++; // Increment the count of valid auctions

        const auctionItem = document.createElement('div');
        auctionItem.classList.add("cool-purple", "auction-item");

        auctionItem.innerHTML = `
            <p>Price: ${auction.buyout_price}</p>
            <p>Owner: ${auction.owner?.ingame_name || 'N/A'}</p>
            <a class="button" target="_blank" style="text-decoration: none;" href="https://warframe.market/auction/${auction.id}">Auction</a>
        `;

        auctionResults.appendChild(auctionItem);
    });

    // Calculate average price and display it only if there are valid auctions
    if (count > 0) {
        const averagePrice = totalPrice / Math.min(count, 5); // Use the count of valid auctions, max 5
        document.getElementById('average-price').innerText = `Average Price: ${averagePrice.toFixed(2)}`;
    } else {
        document.getElementById('average-price').innerText = 'Average Price: 000'; // No valid auctions
    }
}

// Function to fetch dashboard data
async function dashboardfetch(weapon_name = null) {
    if (!weapon_name) {
        return;
    }

    try {
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('auction-results').innerHTML = '<p>API is on cooldown, please run start_server.bat if not already.</p>';
    } finally {
    }
}
let lowestPriceOwner = null;
// Function to display dashboard auctions
function dashboarddisplayAuctions(data, weapon_name) {
    // Initialize prices array for the current weapon if not already created
    if (!_prices_array[weapon_name]) {
      _prices_array[weapon_name] = [];
    }
  
    // Check if data is defined and contains auctions
    if (!data || !data.auctions || !Array.isArray(data.auctions) || data.auctions.length === 0) {
      return;
    }
  
    let lowestPrice = Infinity;  // Initialize with a high value


    data.auctions.forEach(auction => {
      // Check if the seller is online
      if (auction.owner?.last_seen !== null) {
        const isOnline = auction.owner.status === 'ingame'; // Assuming 'ingame' is how online status is defined
        if (!isOnline) {
          return; // Skip this auction if the owner is not online
        }
      }
  
      // Update the lowest price if this auction has a lower price
      if (auction.buyout_price < lowestPrice) {
        lowestPrice = auction.buyout_price;
        lowestPriceOwner = auction.owner.ingame_name;   // Store the owner of the auction with the lowest price
      }
  
      // Include this auction in the calculations
      _prices_array[weapon_name].push(auction.buyout_price); // Store the price in the corresponding array
});
  
    // Check if the lowest price has changed
    const previousLowestPrice = _previousLowestPrices[weapon_name] || null;
    if (!_previousLowestPrices.hasOwnProperty(weapon_name) || lowestPrice !== previousLowestPrice) {
        // Store the new lowest price
        _previousLowestPrices[weapon_name] = lowestPrice;
        // Send the lowest price to linechart.js
        window.dispatchEvent(new CustomEvent('lowestPriceUpdate', { detail: { weapon: weapon_name, _previousLowestPrice: previousLowestPrice, price: lowestPrice, timestamp: new Date().getTime() } }));
    
        // Send auction text to copy to the overlay
          // Dispatch the event to the overlay window
          const { ipcRenderer, ipcMain } = require('electron');
          
          // Example data to send
          const textToCopy = `/w ${lowestPriceOwner} WTB [${weapon_name.replace("_", " ")}] Riven for ${lowestPrice} Platinum (From Riven Shark)`;
          
          // Send data to the overlay window
          ipcRenderer.send('send-overlay-data', {
            text: textToCopy,
            weapon: weapon_name,
            price: lowestPrice,
            previousLowestPrice: previousLowestPrice,
          });
    }
  
    var trackid = weapon_name + "-track-block";
    var trackblock = document.getElementById(trackid) || document.createElement('div');
    trackblock.classList.add("cool-purple", "track-block");
    trackblock.id = trackid;

    trackblock.innerHTML = `
        <p>${weapon_name.replace("_", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
        <div class="lowest_price_trackblock">
        <p>Cheapest Price: ${lowestPrice}</p>
        <img src="images/platinum.webp" style="width: 10%; margin-bottom: 5px;">
        </div>
        <button class="remove-button" onclick="removeTrackBlock('${weapon_name}')">Remove</button>
    `;

    // Append to the dashboard if not already added
    if (!document.getElementById(trackid)) {
        document.getElementById("trackblock_wrapper").appendChild(trackblock);
    }

    var trackPanelBlockid = weapon_name + "-track-panel-block";
    var trackPanelBlock = document.getElementById(trackPanelBlockid) || document.createElement('div');
    trackPanelBlock.id = trackPanelBlockid;

    trackPanelBlock.innerHTML = `
            <div class="track-control-weapon" id="track-control-panel-weapon-${weapon_name}">
                <p>${weapon_name.replace("_", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
                <div class="track-control-price_wrapper">
                    <p>Cheapest: ${lowestPrice}</p>
                    <img src="images/platinum.webp">
                </div>
            </div>
    `;

        
    // Append to the control panel if not already added
    if (!document.getElementById(trackPanelBlockid)) {
        document.getElementById("track-control-panel-weapons-wrapper").appendChild(trackPanelBlock);
    }



  }

// Add this new function to handle removing a track block
async function removeTrackBlock(weapon_name) {
    const trimmed_weapon_name = weapon_name.toLowerCase().replace(/ /g, '_');
    dashboardWeapons = dashboardWeapons.filter(weapon => weapon !== trimmed_weapon_name);
    document.getElementById(`track-control-panel-weapon-${trimmed_weapon_name}`).innerHTML = "";
    
    // Remove the track block from the DOM
    const trackBlock = document.getElementById(trimmed_weapon_name + "-track-block");
    if (trackBlock) {
        trackBlock.remove();
        showPopup(`${weapon_name} from tracking list`, true);
    }

    // Clear the interval for this weapon
    if (intervals[trimmed_weapon_name]) {
        clearInterval(intervals[trimmed_weapon_name]);
        delete intervals[trimmed_weapon_name];
    }


    // Remove the weapon from localStorage
    let existingWeapons = await getWeaponNamesFromLocalStorage();
    existingWeapons = existingWeapons.filter(weapon => weapon !== trimmed_weapon_name);
    setLocalStorage('weapon_names', existingWeapons.join(','), 7);

    // Retrieve the chartData from local storage
    const chartData = getLocalStorage('chartData'); // Assuming this retrieves the object

    if (chartData && chartData.hasOwnProperty(trimmedWeaponName)) {
        // Delete the specified weapon name from the chartData
        delete chartData[trimmedWeaponName];

        // Save the updated chartData back to local storage
        setLocalStorage('chartData', chartData); // Assuming you have a setLocalStorage function
    }
    
    // Update the intervals cookie
    storeIntervals();

    // Dispatch an event to remove the weapon from the graph
    window.dispatchEvent(new CustomEvent('removeWeaponFromGraph', { detail: { weapon: trimmed_weapon_name } }));
}
// Object to store the intervals for each weapon
const intervals = {};

async function checkWeaponNameInFile(weapon_name) {
    if (!weapon_name) {
        return false; // Return false if weapon_name is null
    }

    try {

        const weaponsFilePath = path.join(await ipcRenderer.invoke('get-user-data-path'), 'weapons.json');
        const data = await fs.readFile(weaponsFilePath, 'utf8');
        const weaponNames = JSON.parse(data); // Parse the JSON data

        // Check if the weapon_name exists in the weaponNames array
        if (!weaponNames.includes(weapon_name)) {
            console.log(`${weapon_name} is not found in weapons.json`);
            showPopup("Weapon does not exist"); // Use the popup instead of alert

            return false; // Return false if weapon_name is not found
        }
        
        console.log(`${weapon_name} is found in weapons.json`);
        
        return true; // Return true if found
    } catch (error) {
        console.error('Error reading weapons.json:', error);
        return false; // Return false in case of error
    }
}


// Função para adicionar uma arma ao dashboard
async function addtodashboard(weapon_name = null, showAlert = false) {

    if (!weapon_name) {
        weapon_name = document.querySelector('.weapon').value;
        document.querySelector('.weapon').value = '';
    }

    const trimmed_weapon_name = weapon_name.toLowerCase().replace(/ /g, '_');

    const addOrNot = await checkWeaponNameInFile(trimmed_weapon_name);

    if (addOrNot) {
        // Verifica se a arma já está listada
        if (!intervals[trimmed_weapon_name]) {

            if (showAlert) {
                showPopup("Now fetching " + weapon_name, true); // Usa o popup em vez de alert
            }

            // Obtém nomes de armas existentes do armazenamento local
            let existingWeapons = await getWeaponNamesFromLocalStorage();

            // Garante que existingWeapons seja um array
            if (!Array.isArray(existingWeapons)) {
                existingWeapons = [];
            }

            // Adiciona o novo nome da arma se ainda não estiver incluído
            if (!existingWeapons.includes(trimmed_weapon_name)) {
                existingWeapons.push(trimmed_weapon_name);
                setLocalStorage('weapon_names', existingWeapons.join(','), 7); // Armazena por 7 dias
            }

            // Adiciona a arma ao array das armas do dashboard
            if (!dashboardWeapons.includes(trimmed_weapon_name)) {
                dashboardWeapons.push(trimmed_weapon_name);
                newWeapon = trimmed_weapon_name;
                console.log("Dashboard weapons pushed to array to batch:", dashboardWeapons)
            }

            storeIntervals();
        } else if (showAlert) {
            showPopup("Weapon already listed", weapon_name); // Usa o popup em vez de alert
        }
    }
}


// Function to store intervals in local storage
function storeIntervals() {
    const intervalLocalStorage = [];
    Object.keys(intervals).forEach(weaponName => {
        intervalLocalStorage.push(`${weaponName}=${intervals[weaponName]}`);
    });
    setLocalStorage('intervals', intervalLocalStorage.join(','), 7); // Store for 7 days
}

function showSettings() {
    document.getElementById('settings-container').style.display = 'flex';
    document.getElementById('settings-container').classList.add("open-transition");

    document.getElementById('auction-container').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");
    
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('dashboard-container').classList.remove("open-transition");

    document.getElementById('graph_interface').style.display = "none";
    document.getElementById('graph_interface').classList.remove("open-transition");

    document.getElementById('all-weapon-data').style.display = 'none';
    document.getElementById('all-weapon-data').classList.remove("open-transition");
    
    document.getElementById('log_in_interface').style.display = 'none';
    document.getElementById('log_in_interface').classList.remove("open-transition");
}
// Function to hide auctions
function showAuction() {
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('settings-container').classList.remove("open-transition");

    document.getElementById('auction-container').style.display = 'flex';
    document.getElementById('auction-container').classList.add("open-transition");
    
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('dashboard-container').classList.remove("open-transition");

    document.getElementById('graph_interface').style.display = "none";
    document.getElementById('graph_interface').classList.remove("open-transition");

    document.getElementById('all-weapon-data').style.display = 'none';
    document.getElementById('all-weapon-data').classList.remove("open-transition");
    
    document.getElementById('log_in_interface').style.display = 'none';
    document.getElementById('log_in_interface').classList.remove("open-transition");
}

// Function to hide dashboard
function showDashboard() {
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('settings-container').classList.remove("open-transition");

    document.getElementById('auction-container').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");

    document.getElementById('dashboard-container').style.display = 'flex';
    document.getElementById('dashboard-container').classList.add("open-transition");

    document.getElementById('graph_interface').style.display = "none";
    document.getElementById('graph_interface').classList.remove("open-transition");

    document.getElementById('all-weapon-data').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");
    
    document.getElementById('log_in_interface').style.display = 'none';
    document.getElementById('log_in_interface').classList.remove("open-transition");
}

function showGraph() {
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('settings-container').classList.remove("open-transition");

    document.getElementById('auction-container').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");

    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('dashboard-container').classList.remove("open-transition");

    document.getElementById('graph_interface').style.display = "flex";
    document.getElementById('graph_interface').classList.add("open-transition");

    document.getElementById('all-weapon-data').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");
    
    document.getElementById('log_in_interface').style.display = 'none';
    document.getElementById('log_in_interface').classList.remove("open-transition");
}

function showTable() {
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('settings-container').classList.remove("open-transition");

    document.getElementById('auction-container').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");

    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('dashboard-container').classList.add("open-transition");

    document.getElementById('graph_interface').style.display = "none";
    document.getElementById('graph_interface').classList.remove("open-transition");

    document.getElementById('all-weapon-data').style.display = 'flex';
    document.getElementById('auction-container').classList.remove("open-transition");
    
    document.getElementById('log_in_interface').style.display = 'none';
    document.getElementById('log_in_interface').classList.remove("open-transition");
}

function showLogin() {
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('settings-container').classList.remove("open-transition");

    document.getElementById('auction-container').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");

    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('dashboard-container').classList.remove("open-transition");

    document.getElementById('graph_interface').style.display = "none";
    document.getElementById('graph_interface').classList.remove("open-transition");

    document.getElementById('all-weapon-data').style.display = 'none';
    document.getElementById('auction-container').classList.remove("open-transition");
    
    document.getElementById('log_in_interface').style.display = 'flex';
    document.getElementById('log_in_interface').classList.add("open-transition");
}

function showLoadingIcon() {
    document.getElementById('loading-icon').style.display = "block";
    document.getElementById('loading-icon').style.scale = '1';
}

function hideLoadingIcon() {
    document.getElementById('loading-icon').style.display = "none";
    document.getElementById('loading-icon').style.scale = '0';
}

// toggleDarkMode function
function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const darkMode = getLocalStorage('dark-mode');
    if (darkMode === 'true') {
        setLocalStorage('dark-mode', 'false', 7);
    } else {
        setLocalStorage('dark-mode', 'true', 7);
    }
}
  
    // Check if dark mode is enabled in local storage and enable it if so
    const darkMode = getLocalStorage('dark-mode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
  
  // Add a button to toggle dark mode
  const darkModeButton = document.createElement('button');
  darkModeButton.textContent = 'Dark Mode';
  darkModeButton.onclick = toggleDarkMode;
  darkModeButton.id = "dark-mode-button"
  document.getElementById("real-header").appendChild(darkModeButton);

// Function to load weapons from local storage on page load
async function loadWeaponsFromLocalStorage() {
    const weaponNames = await getWeaponNamesFromLocalStorage();
    if (Array.isArray(weaponNames)) {
        weaponNames.forEach(weapon_name => {
            const trimmed_weapon_name = weapon_name.toLowerCase().replace(/ /g, '_');
            addtodashboard(trimmed_weapon_name, false);
        });
    } else {
        console.error('Expected weaponNames to be an array, but got:', weaponNames);
    }
}

// Function to delete all local storage
function deleteAllLocalStorage() {
    localStorage.clear();
}

// Function to delete a value from local storage
function deleteLocalStorage(name) {
    localStorage.removeItem(name);
}


function stopfetching() {
    deleteAllLocalStorage();
    Object.keys(intervals).forEach(weaponName => {
      clearInterval(intervals[weaponName]);
      delete intervals[weaponName];
    });
    deleteLocalStorage('intervals');
}