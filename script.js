document.getElementById('fetch-auctions').addEventListener('click', fetchAuctions);
let prices = {}; // Object to hold prices for each weapon

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
    const weapon_name = document.querySelector('.weapon').value.toLowerCase().replace(/ /g, '_');
    const url = `proxy.php?weapon=${encodeURIComponent(weapon_name)}`; // Adjust the path if necessary

    try {
        const response = await fetch(url);
        console.log(response); // Log the response object
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data); // Log the data to check its structure
        displayAuctions(data.payload, weapon_name); // Pass the weapon_name to displayAuctions
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('auction-results').innerHTML = '<p>Error fetching data. Please try again later.</p>';
    }
}

// Function to display auctions
function displayAuctions(data, weapon_name) {
    const auctionResults = document.getElementById('auction-results');

    // Clear previous results
    auctionResults.innerHTML = '';

    // Initialize prices array for the current weapon if not already created
    if (!prices[weapon_name]) {
        prices[weapon_name] = [];
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
            prices[weapon_name].push(auction.buyout_price); // Store the price in the corresponding array
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
async function dashboardfetch(weapon_name) {
    console.log("fetched " + weapon_name);

    const url = `proxy.php?weapon=${encodeURIComponent(weapon_name)}`; // Adjust the path if necessary

    try {
        const response = await fetch(url);
        console.log(response); // Log the response object
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log(data); // Log the data to check its structure
        dashboarddisplayAuctions(data.payload, weapon_name); // Pass the weapon_name to dashboarddisplayAuctions
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('auction-results').innerHTML = '<p>Error fetching data. Please try again later.</p>';
    }
}

// Function to display dashboard auctions
function dashboarddisplayAuctions(data, weapon_name) {
    // Initialize prices array for the current weapon if not already created
    if (!prices[weapon_name]) {
        prices[weapon_name] = [];
    }


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
        prices[weapon_name].push(auction.buyout_price); // Store the price in the corresponding array
        
        var trackid = weapon_name + "-track-block";
        var trackblock = document.getElementById(trackid) || document.createElement('div'); // Create if it doesn't exist
        trackblock.classList.add("cool-purple", "track-block");
        trackblock.id = trackid;

        // Update trackblock innerHTML
        trackblock.innerHTML = `
            <p>Weapon: ${weapon_name}</p>
            <p>Lowest price: ${Math.min(...prices[weapon_name]) || 'N/A'}</p>
        `;

        // Append to the dashboard if not already added
        if (!document.getElementById(trackid)) {
            document.getElementById("trackblock_wrapper").appendChild(trackblock);
        }
    });
}

// Object to store the intervals for each weapon
const intervals = {};

// Function to add a weapon to the dashboard
function addtodashboard() {
    const weapon_name = document.querySelector('.weapon').value;
    const trimmed_weapon_name = weapon_name.toLowerCase().replace(/ /g, '_');

    // Get existing weapon names from cookies
    let existingWeapons = getWeaponNamesFromCookies();

    // Add the new weapon name to the cookies if it doesn't already exist
    if (!existingWeapons.includes(trimmed_weapon_name)) {
        existingWeapons.push(trimmed_weapon_name);
        setCookie('weapon_names', existingWeapons.join(','), 7); // Store for 7 days
    }

    // Check if an interval for this weapon already exists
    if (!intervals[trimmed_weapon_name]) {
        // Start the fetch for the weapon
        dashboardfetch(trimmed_weapon_name);

        // Set an interval for fetching data every 10 seconds
        intervals[trimmed_weapon_name] = setInterval(() => {
            dashboardfetch(trimmed_weapon_name);
        }, 10 * 1 * 1000); // Update every 10 seconds

        alert(`Now fetching`);
    } else {
        alert(`Fetching for this weapon is already in progress.`);
    }
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

// Function to load weapons from cookies on page load
function loadWeaponsFromCookies() {
    const weaponNames = getWeaponNamesFromCookies();
    weaponNames.forEach(weapon_name => {
        dashboardfetch(weapon_name);
        // Optionally, you can call addtodashboard to handle intervals and UI updates
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
    clearInterval();
    const trackBlocksToRemove = document.querySelectorAll(".track-block");
    trackBlocksToRemove.forEach(block => {
        block.remove(); // Remove o elemento do DOM
    });
}