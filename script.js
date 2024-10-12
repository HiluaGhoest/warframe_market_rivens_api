document.getElementById('fetch-auctions').addEventListener('click', fetchAuctions);
let _prices_array = {}; // Object to hold prices for each weapon
const _previousLowestPrices = {};

window.onload = function() {
  loadWeaponsFromCookies();
  const intervalCookie = getCookie('intervals');
  if (intervalCookie) {
    const intervalPairs = intervalCookie.split(',');
    intervals = {};
    intervalPairs.forEach(pair => {
      const [weaponName, intervalId] = pair.split('=');
      intervals[weaponName] = setInterval(() => {
        dashboardfetch(weaponName);
      }, 10 * 1 * 1000); // Update every 10 seconds
    });
    console.log('Intervals:', intervals); // Add this line to verify the intervals object
  }
};

// Function to set a cookie
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Function to get a cookie by name
function getCookie(name) {
    return document.cookie.split('; ').reduce((r, c) => {
        const [key, value] = c.split('=');
        return key === name ? decodeURIComponent(value) : r;
    }, '');
}

// Function to get all weapon names from cookies
function getWeaponNamesFromCookies() {
    const weaponNames = getCookie('weapon_names');
    return weaponNames ? weaponNames.split(',') : [];
}

// Function to fetch auctions based on weapon name
async function fetchAuctions() {
    showLoadingIcon();
    const weapon_name = document.querySelector('.weapon').value.toLowerCase().replace(/ /g, '_');
    const url = `api/proxy.php?weapon=${encodeURIComponent(weapon_name)}`;

    try {
        const response = await fetch(url);
        console.log(response);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
        displayAuctions(data.payload, weapon_name);

        window.dispatchEvent(new Event('load'));
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('auction-results').innerHTML = '<p>Error fetching data. Please try again later.</p>';
    } finally {
        hideLoadingIcon();
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
            <a class="button" target="_blank" href="https://warframe.market/auction/${auction.id}">Auction</a>
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
    showLoadingIcon();
    console.log("fetched " + weapon_name);

    const url = `api/proxy.php?weapon=${encodeURIComponent(weapon_name)}`;

    try {
        const response = await fetch(url);
        console.log(response);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data);
        dashboarddisplayAuctions(data.payload, weapon_name);
        console.log(data.payload);
        updateChart(data.payload);
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('auction-results').innerHTML = '<p>Error fetching data. Please try again later.</p>';
    } finally {
        hideLoadingIcon();
    }
}

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
      }
  
      // Include this auction in the calculations
      _prices_array[weapon_name].push(auction.buyout_price); // Store the price in the corresponding array
    });
  
    // Check if the lowest price has changed
    if (!_previousLowestPrices.hasOwnProperty(weapon_name) || lowestPrice !== _previousLowestPrices[weapon_name]) {
      // Store the new lowest price
      _previousLowestPrices[weapon_name] = lowestPrice;
      // Send the lowest price to linechart.js
      window.dispatchEvent(new CustomEvent('lowestPriceUpdate', { detail: { weapon: weapon_name, price: lowestPrice, timestamp: new Date().getTime() } }));
    }
  
    var trackid = weapon_name + "-track-block";
    var trackblock = document.getElementById(trackid) || document.createElement('div');
    trackblock.classList.add("cool-purple", "track-block");
    trackblock.id = trackid;

    trackblock.innerHTML = `
        <p>${weapon_name}</p>
        <p>${lowestPrice} Platinum</p>
        <button class="remove-button" onclick="removeTrackBlock('${weapon_name}')">Remove</button>
    `;

    // Append to the dashboard if not already added
    if (!document.getElementById(trackid)) {
        document.getElementById("trackblock_wrapper").appendChild(trackblock);
    }
  }

// Add this new function to handle removing a track block
function removeTrackBlock(weapon_name) {
    const trimmed_weapon_name = weapon_name.toLowerCase().replace(/ /g, '_');
    
    // Remove the track block from the DOM
    const trackBlock = document.getElementById(trimmed_weapon_name + "-track-block");
    if (trackBlock) {
        trackBlock.remove();
    }

    // Clear the interval for this weapon
    if (intervals[trimmed_weapon_name]) {
        clearInterval(intervals[trimmed_weapon_name]);
        delete intervals[trimmed_weapon_name];
    }

    // Remove the weapon from cookies
    let existingWeapons = getWeaponNamesFromCookies();
    existingWeapons = existingWeapons.filter(weapon => weapon !== trimmed_weapon_name);
    setCookie('weapon_names', existingWeapons.join(','), 7);

    // Update the intervals cookie
    storeIntervals();

    // Dispatch an event to remove the weapon from the graph
    window.dispatchEvent(new CustomEvent('removeWeaponFromGraph', { detail: { weapon: trimmed_weapon_name } }));
}
// Object to store the intervals for each weapon
const intervals = {};

// Function to add a weapon to the dashboard
function addtodashboard(weapon_name = null, showAlert = false) {
    if (!weapon_name) {
        weapon_name = document.querySelector('.weapon').value;
    }
    const trimmed_weapon_name = weapon_name.toLowerCase().replace(/ /g, '_');

    let existingWeapons = getWeaponNamesFromCookies();

    if (!existingWeapons.includes(trimmed_weapon_name)) {
        existingWeapons.push(trimmed_weapon_name);
        setCookie('weapon_names', existingWeapons.join(','), 7);
    }

    if (!intervals[trimmed_weapon_name]) {
        if (showAlert) {
            alert("Now fetching: " + weapon_name);
        }
        showLoadingIcon(); // Show loading icon before initial fetch
        dashboardfetch(trimmed_weapon_name); // Fetch immediately
        intervals[trimmed_weapon_name] = setInterval(() => {
            dashboardfetch(trimmed_weapon_name);
        }, 10 * 1 * 1000);
        storeIntervals();
    } else if (showAlert) {
        alert("Can't fetch, weapon already listed: " + weapon_name);
    }
}

function storeIntervals() {
    const intervalCookies = [];
    Object.keys(intervals).forEach(weaponName => {
        intervalCookies.push(`${weaponName}=${intervals[weaponName]}`);
    });
    setCookie('intervals', intervalCookies.join(','), 7); // Store for 7 days
}

// Function to hide auctions
function hideauctions() {
    document.getElementById('dashboard-container').style.display = 'flex';
    document.getElementById('auction-container').style.display = 'none';
}

// Function to hide dashboard
function hidedashboard() {
    document.getElementById('auction-container').style.display = 'flex';
    document.getElementById('dashboard-container').style.display = 'none';
}

function showGraph() {
    document.getElementById('auction-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'none';
    document.getElementById('graph_interface').style.display = "flex";
    document.getElementById('footer').style.display = "flex";
}

function hideGraph() {
    document.getElementById('graph_interface').style.display = "none";
    document.getElementById('footer').style.display = "none";
    document.getElementById('auction-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'flex';
}

function showLoadingIcon() {
    document.getElementById('loading-icon').style.display = 'block';
}

function hideLoadingIcon() {
    document.getElementById('loading-icon').style.display = 'none';
}

// Function to load weapons from cookies on page load
function loadWeaponsFromCookies() {
    const weaponNames = getWeaponNamesFromCookies();
    weaponNames.forEach(weapon_name => {
        const trimmed_weapon_name = weapon_name.toLowerCase().replace(/ /g, '_');
        addtodashboard(trimmed_weapon_name, false); // Pass false to not show the alert
    });
}
// Load weapons when the page is loaded
window.onload = function() {
    loadWeaponsFromCookies();
};

function deleteAllCookies() {
    // Get all cookies
    const cookies = document.cookie.split(";");

    // Loop through and delete each cookie
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const cookieName = cookie.split("=")[0].trim();
        deleteCookie(cookieName);
    }
}

function deleteCookie(name) {
    // Set the cookie expiration date to a past date
    document.cookie = name + '=; Max-Age=0; path=/';
}


function stopfetching() {
    deleteAllCookies();
    Object.keys(intervals).forEach(weaponName => {
      clearInterval(intervals[weaponName]);
      delete intervals[weaponName];
    });
    deleteCookie('intervals');
}
