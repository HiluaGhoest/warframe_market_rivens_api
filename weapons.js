// weapons.js
const weaponsModule = (() => {
    const CACHE_DURATION = 5 * 1000; // 5 seconds in milliseconds
    const BATCH_SIZE = 10; // Number of weapons to fetch in a single batch

    let cachedAuctions = null;
    let lastFetchTime = 0;

    

    const sortButton = document.getElementById("sort-button");
    let sortOrder = 'asc'; // Initialize sort order to ascending

    sortButton.addEventListener("click", () => {
        sortTable(sortOrder);
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; // Toggle sort order
    });

    function sortTable(sortOrder) {
        const tableBody = document.querySelector('#all-weapon-data table tbody');
        const rows = Array.from(tableBody.rows);

        rows.sort((rowA, rowB) => {
            const priceA = parseFloat(rowA.cells[1].textContent);
            const priceB = parseFloat(rowB.cells[1].textContent);

            const secondPriceA = rowA.cells[2].textContent === '-' ? Infinity : parseFloat(rowA.cells[2].textContent);
            const secondPriceB = rowB.cells[2].textContent === '-' ? Infinity : parseFloat(rowB.cells[2].textContent);

            if (sortOrder === 'asc') {

                if (priceA !== priceB) return priceA - priceB;
                else return secondPriceA - secondPriceB;
            } else {

                if (priceA !== priceB) return priceB - priceA;
                else return secondPriceB - secondPriceA;
            }
        });

        tableBody.innerHTML = ''; // Clear existing rows
        rows.forEach(row => tableBody.appendChild(row));
    }

    const profitSortButton = document.getElementById("profit-sort-button");
    let profitSortOrder = 'asc'; // Initialize sort order to ascending

    profitSortButton.addEventListener("click", () => {
        sortTableByProfit(profitSortOrder);
        profitSortOrder = profitSortOrder === 'asc' ? 'desc' : 'asc'; // Toggle sort order
    });

    function sortTableByProfit(sortOrder) {
        const tableBody = document.querySelector('#all-weapon-data table tbody');
        const rows = Array.from(tableBody.rows);

        rows.sort((rowA, rowB) => {
            const profitA = rowA.cells[3].textContent === '-' ? -Infinity : parseFloat(rowA.cells[3].textContent);
            const profitB = rowB.cells[3].textContent === '-' ? -Infinity : parseFloat(rowB.cells[3].textContent);

            if (sortOrder === 'asc') {
                return profitA - profitB;
            } else {
                return profitB - profitA;
            }
        });

            tableBody.innerHTML = ''; // Clear existing rows
            rows.forEach(row => tableBody.appendChild(row));
    }

    async function fetchWeaponAuctions(weapons) {
        console.log(`Fetching auctions for ${weapons.length} weapons`);
        const auctionsPromises = weapons.map(weapon => 

            fetch(`api/proxy.php?weapon=${encodeURIComponent(weapon.url_name)}`)
                .then(response => response.json())
                .then(data => {
                    if (!data.payload || !data.payload.auctions) {
                        console.warn(`No auctions found for ${weapon.item_name}`);

                        return { weapon: weapon.item_name, auction: null, secondAuction: null };
                    }

                    // Filter for 'ingame' status and find the lowest and second lowest prices
                    const ingameAuctions = data.payload.auctions.filter(auction => auction.owner.status === "ingame");
                    const lowestPriceAuction = ingameAuctions.reduce((lowest, current) => 
                        (current.starting_price < lowest.starting_price) ? current : lowest
                    , ingameAuctions[0]);

                    const secondLowestPriceAuction = ingameAuctions.filter(auction => auction !== lowestPriceAuction).reduce((secondLowest, current) => 
                        (current.starting_price < secondLowest.starting_price) ? current : secondLowest
                    , ingameAuctions[1]);

                    return {

                        weapon: weapon.item_name,
                        auction: lowestPriceAuction || null,
                        secondAuction: secondLowestPriceAuction || null
                    };
                })
                .catch(error => {
                    console.error(`Error fetching auctions for ${weapon.item_name}:`, error);

                    return { weapon: weapon.item_name, auction: null, secondAuction: null };
                })
        );
        const results = await Promise.all(auctionsPromises);
        console.log(`Fetched auctions for ${results.length} weapons`);

        return results.filter(result => result.auction !== null);

    }


    async function fetchAllWeaponAuctions() {
        console.log("Starting to fetch all weapon auctions");
        const currentTime = Date.now();

        if (cachedAuctions && (currentTime - lastFetchTime < CACHE_DURATION)) {
            console.log("Returning cached auctions");

            return cachedAuctions;
        }

        const loadingIcon = document.getElementById('loading-icon');
        loadingIcon.style.display = 'flex';

        try {
            console.log("Fetching list of weapons");

            const weaponsResponse = await fetch('api/proxy.php');
            const weaponsData = await weaponsResponse.json();
            const weapons = weaponsData.payload.items;
            console.log(`Fetched ${weapons.length} weapons`);

            const allAuctions = [];
            const tableBody = document.querySelector('#all-weapon-data table tbody');
            tableBody.innerHTML = ''; // Clear existing rows


            for (let i = 0; i < weapons.length; i += BATCH_SIZE) {
                const batch = weapons.slice(i, Math.min(i + BATCH_SIZE, weapons.length));
                const batchAuctions = await fetchWeaponAuctions(batch);
                allAuctions.push(...batchAuctions);

                batchAuctions.forEach((auction, index) => {
                    if (index < 5) {
                        console.log(`Auction ${index + 1}:`, auction); // Log first 5 auctions for detailed inspection
                    }

                    const row = document.createElement('tr');                    

                    const weaponCell = document.createElement('td');
                    weaponCell.textContent = auction.weapon;
                    row.appendChild(weaponCell);

                    const priceCell = document.createElement('td');
                    priceCell.textContent = auction.auction.starting_price;
                    row.appendChild(priceCell);

                    const secondPriceCell = document.createElement('td');
                    secondPriceCell.textContent = auction.secondAuction ? auction.secondAuction.starting_price : '-';
                    row.appendChild(secondPriceCell);

                    const profitCell = document.createElement('td');
                    profitCell.textContent = calculateProfit(auction);
                    row.appendChild(profitCell);

                    const sellerCell = document.createElement('td');

                    sellerCell.textContent = auction.auction.owner.ingame_name;
                    row.appendChild(sellerCell);

                    const linkCell = document.createElement('td');
                    const linkButton = document.createElement('button');

                    linkButton.textContent = 'View Auction';
                    linkButton.onclick = () => window.open(`https://warframe.market/auction/${auction.auction.id}`, '_blank');
                    linkCell.appendChild(linkButton);
                    row.appendChild(linkCell);
                    tableBody.appendChild(row);
                });
                console.log(`Fetched lowest price ingame auctions for ${batchAuctions.length} weapons in batch ${i / BATCH_SIZE + 1}`);
            }

            console.log(`Total lowest price ingame auctions fetched: ${allAuctions.length}`);
            loadingIcon.style.display = 'none';
            cachedAuctions = allAuctions;
            lastFetchTime = currentTime;

            // Call fetchAllWeaponAuctions again after a short delay
            setTimeout(fetchAllWeaponAuctions, 5000); // 5 seconds delay
            console.log("RESTARTING");
            return allAuctions;
        } catch (error) {
            console.error('Error fetching all weapon auctions:', error);
            loadingIcon.style.display = 'none';
            return [];
        }
    }

    function calculateProfit(auction) {
        if (auction.secondAuction) {
            const profit = auction.secondAuction.starting_price - auction.auction.starting_price;
            return profit.toFixed(0); // Format the profit to 2 decimal places
        } else {
            return '-'; // Return a dash if there is no second auction
        }
    }

    async function showWeapons() {
        console.log("showWeapons function called");

        const allWeaponData = document.getElementById('all-weapon-data');

        console.log("Fetching all ingame weapon auctions");
        await fetchAllWeaponAuctions();
        console.log("Finished showing weapons");
    };

    return {
        showWeapons
    };
})();

 // Make showWeapons globally accessible
window.showWeapons = weaponsModule.showWeapons;