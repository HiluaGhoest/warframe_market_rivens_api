// weapons.js
const weaponsModule = (() => {
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds
    const BATCH_SIZE = 10; // Number of weapons to fetch in a single batch
    const dashboardWeaponsUpdateTime = 1;
    const delayBetweenBatches = 5 * 1000;

    let searchedWeapons;

    let cachedAuctions = null;
    let lastFetchTime = 0;

    let sortOrder = 'asc'; // Initialize sort order to ascending
    let sortType = 'price'; // Initialize sort type to price

    const sortButton = document.getElementById("sort-button");
    sortButton.addEventListener("click", () => {
        sortType = 'price'; // Toggle sort type
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; // Toggle sort order
        sortTable();
    });

    const profitSortButton = document.getElementById("profit-sort-button");
    profitSortButton.addEventListener("click", () => {
        sortType = 'profit'; // Toggle sort type
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; // Toggle sort order
        sortTable();
    });

    function sortTable() {
        const tableBody = document.querySelector('#all-weapon-data table tbody');
        const rows = Array.from(tableBody.rows);

        if (sortType === 'price') {
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
        } else if (sortType === 'profit') {
            rows.sort((rowA, rowB) => {
                const profitA = rowA.cells[3].textContent === '-' ? -Infinity : parseFloat(rowA.cells[3].textContent);
                const profitB = rowB.cells[3].textContent === '-' ? -Infinity : parseFloat(rowB.cells[3].textContent);

                if (sortOrder === 'asc') {
                    return profitA - profitB;
                } else {
                    return profitB - profitA;
                }
            });
        }

        // Update the table body with the sorted rows
        tableBody.innerHTML = ''; // Clear existing rows
        rows.forEach(row => tableBody.appendChild(row));

    }


    async function fetchWeaponAuctions(weaponNames) {
        // Verifique se `weaponNames` é um array
        if (!Array.isArray(weaponNames)) {
            console.error("O argumento deve ser um array de nomes de armas.");
            return [];
        }
    
        const auctionsPromises = weaponNames.map(async weaponName => {
            try {
                // Use o nome da arma diretamente na chamada da função
                const response = await fetchRivenData(weaponName);
                
                const data = response; // A resposta já é o que você deseja
                if (dashboardWeapons.includes(weaponName)) {
                    dashboarddisplayAuctions(data.payload, weaponName);
                    updateChart(data.payload);
                }
    
                if (!data.payload || !data.payload.auctions) {
                    console.warn(`No auctions found for ${weaponName}`);
                    return { weapon: weaponName, auction: null, secondAuction: null };
                }
    
                // Filtra o status 'ingame' e encontra os menores preços
                const ingameAuctions = data.payload.auctions.filter(auction => auction.owner.status === "ingame");
                const lowestPriceAuction = ingameAuctions.reduce((lowest, current) => 
                    (current.starting_price < lowest.starting_price) ? current : lowest
                , ingameAuctions[0]);
    
                const secondLowestPriceAuction = ingameAuctions.filter(auction => auction !== lowestPriceAuction).reduce((secondLowest, current) => 
                    (current.starting_price < secondLowest.starting_price) ? current : secondLowest
                , ingameAuctions[1]);
    
                searchedWeapons.push(weaponName);
    
                return {
                    weapon: weaponName,
                    auction: lowestPriceAuction || null,
                    secondAuction: secondLowestPriceAuction || null
                };
            } catch (error) {
                console.error(`Error fetching auctions for ${weaponName}:`, error);
                return { weapon: weaponName, auction: null, secondAuction: null };
            }
        });
    
        const results = await Promise.all(auctionsPromises);
    
        return results.filter(result => result.auction !== null);
    }
    

    
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function fetchAllWeaponAuctions() {
        
        console.log("Starting to fetch all weapon auctions");
        searchedWeapons = [];

        const currentTime = Date.now();
    
        if (cachedAuctions && (currentTime - lastFetchTime < CACHE_DURATION)) {
            console.log("Returning cached auctions");
    
            return cachedAuctions;
        }
    
        const loadingIcon = document.getElementById('loading-icon');
        loadingIcon.style.scale = '1';
    
        try {
            console.log("Fetching list of weapons");
            
            const weaponsResponse = await fetchRivenData();

            const weapons = weaponsResponse.payload.items.map(item => item.url_name);
            
            const allAuctions = [];
            const tableBody = document.querySelector('#all-weapon-data table tbody');
    
            const batchSize = BATCH_SIZE
            let batchCount = 0; // Contador de lotes
            
            for (let i = 0; i < weapons.length; i += batchSize) {
                // Slice the batch of weapons (up to batchSize)
                // Filtra as armas que não estão na blacklist e cria um array único
                const availableWeapons = weapons.filter(weapon => {
                    if (searchedWeapons.includes(weapon.item_name)) {
                        console.log(`Weapon is in blacklist array: ${weapon.item_name}`);
                        return false; // Excluir da lista
                    }
                    return true; // Incluir no array
                });

                // Gerar o batch com base nas armas filtradas
                const batch = availableWeapons.slice(i, i + batchSize); // Apenas as armas filtradas

                if (newWeapon) {
                    console.log(newWeapon)
                    batch.push(newWeapon); // Add newWeapon to the batch
                    const index = searchedWeapons.indexOf(newWeapon);
                    if (index !== -1) {
                        console.log(`Removing ${newWeapon} from blacklist.`);
                        searchedWeapons.splice(index, 1); // Remove a nova arma da blacklist
                    }
                    newWeapon = null;
                }
                // Adicionando armas do dashboard
                // REMOVE THE FILTERING FOR DASHBOARD WEAPONS WHEN CREATING THE CRACKED VERSION
                // Adiciona as armas do dashboard ao batch se batchCount for divisível por 5
                if (batchCount % dashboardWeaponsUpdateTime === 0) {

                    // Evitar duplicatas ao adicionar dashboardWeapons
                    const uniqueDashboardWeapons = dashboardWeapons.filter(weapon => 
                        !batch.some(b => b.item_name === weapon)
                    );

                    console.log("Unique dashboard weapons:", uniqueDashboardWeapons);
                    
                    if (uniqueDashboardWeapons.length > 0) {
                        batch.push(...uniqueDashboardWeapons);
                        console.log("Added unique dashboard weapons to batch:", uniqueDashboardWeapons);
                    } else {
                        console.log("No unique dashboard weapons to add for this batch.");
                    }
                }

                    console.log("Batch: ", batchCount)

                    // Concatenar batches
                    const finalBatch = [...batch];

                // Exibir as armas do batch
                finalBatch.forEach((weapon, index) => {
                    console.log(`Arma ${index + 1}: ${finalBatch[index]}`);
                });
                    
                // Buscar leilões para o batch atual de armas
                const batchAuctions = await fetchWeaponAuctions(finalBatch);
                console.log("Batch finalizado com", finalBatch.length);

                await delay(delayBetweenBatches);
                // Delay before processing the next batch
                // Push results from the current batch into the allAuctions array
                allAuctions.push(...batchAuctions);
            
            

                batchAuctions.forEach((auction, index) => {
                    // if (index < 5) {
                    //     console.log(`Auction ${index + 1}:`, auction); // Log first 5 auctions for detailed inspection
                    // }
    
                    // Find the existing row for the auction
                    const normalizedAuctionWeapon = auction.weapon.replace("_", " ").toLowerCase();
                    const existingRow = Array.from(tableBody.rows).find(row => row.cells[0].textContent.toLowerCase() === normalizedAuctionWeapon);

    
                    if (existingRow) {
                        // Update the existing row
                        
                        const weaponCell = existingRow.cells[0];
                        weaponCell.textContent = auction.weapon.replace("_", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                        const priceCell = existingRow.cells[1];
                        priceCell.textContent = auction.auction.starting_price;
                        
                        const secondPriceCell = existingRow.cells[2];
                        secondPriceCell.textContent = auction.secondAuction ? auction.secondAuction.starting_price : '-';
                        
                        const profitCell = existingRow.cells[3];
                        profitCell.textContent = calculateProfit(auction);
                        if (calculateProfit(auction) > 30) {
                            profitCell.style.color = 'green';
                        } else if (calculateProfit(auction) < 20) {
                            profitCell.style.color = 'red';
                        }
                        
                        const sellerCell = existingRow.cells[4];
                        sellerCell.textContent = auction.auction.owner.ingame_name;
                        

                        const timeElapsedCell = existingRow.cells[5];
                        // Calculate the time elapsed]

                        const createdAt = new Date(auction.auction.created); // Original creation date
                        const lastSeenAt = new Date(auction.auction.owner.last_seen); // Last seen date
                        const currentTime = new Date(); // Current time
                        
                        // Determine the effective start time
                        const effectiveStartTime = createdAt > lastSeenAt ? createdAt : lastSeenAt;
                        
                        // Calculate the time elapsed since the effective start time
                        const timeElapsedSinceEffectiveStart = currentTime - effectiveStartTime;
                        const hours = Math.floor(timeElapsedSinceEffectiveStart / (1000 * 60 * 60));
                        const minutes = Math.floor((timeElapsedSinceEffectiveStart % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeElapsedSinceEffectiveStart % (1000 * 60)) / 1000);
                        
                        // Format the time elapsed string
                        const timeElapsedString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        
                        // Update the Time Elapsed cell
                        timeElapsedCell.textContent = timeElapsedString;

                        const linkCell = existingRow.cells[6];
                        const linkButton = linkCell.querySelector('button');
                        linkButton.textContent = "SNIPE";

                        const textToCopy = `/w ${auction.auction.owner.ingame_name} WTB [${auction.weapon.replace("_", " ")}] Riven for ${auction.auction.starting_price} Platinum (From Riven Shark)`;

                        linkButton.onclick = () => {
                            navigator.clipboard.writeText(textToCopy).then(() => {
                                console.log('text copied to clipboard!');
                        
                                // Create a popup notification
                                const popup = document.createElement('div');
                                popup.className = 'popup';
                                popup.textContent = 'Ctrl + V in game chat!';
                                document.body.appendChild(popup);
                              
                              // Auto-remove the popup after 2 seconds
                              setTimeout(() => {
                                popup.remove();
                              }, 2000);
                            }).catch((err) => {
                              console.error('Failed to copy text: ', err);
                            });
                          };
                        
                        const trackCell = existingRow.cells[7];
                        const trackButton = trackCell.querySelector('button');
                        trackButton.textContent = 'Track'
                        trackButton.onclick = () => {
                            addtodashboard(weaponCell.textContent, true);
                            showPopup("Now fetching " + weaponCell.textContent.replace("_", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), true)
                        }
                        
                    } else {
                        // Create a new row
                        const row = document.createElement('tr');                    
    
                        const weaponCell = document.createElement('td');
                        weaponCell.textContent = auction.weapon.replace("_", " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        row.appendChild(weaponCell);
    
                        const priceCell = document.createElement('td');
                        priceCell.textContent = auction.auction.starting_price;
                        row.appendChild(priceCell);
    
                        const secondPriceCell = document.createElement('td');
                        secondPriceCell.textContent = auction.secondAuction ? auction.secondAuction.starting_price : '-';
                        row.appendChild(secondPriceCell);
    
                        const profitCell = document.createElement('td');
                        profitCell.textContent = calculateProfit(auction);
                        if (calculateProfit(auction) > 30) {
                            profitCell.style.color = 'green';
                        } else if (calculateProfit(auction) < 20) {
                            profitCell.style.color = 'red';
                        }
                        row.appendChild(profitCell);
    
                        const sellerCell = document.createElement('td');
    
                        sellerCell.textContent = auction.auction.owner.ingame_name;
                        row.appendChild(sellerCell);
    
                        // Create a new cell for the time elapsed
                        const timeElapsedCell = document.createElement('td');
                        row.appendChild(timeElapsedCell);
                        // Calculate the time elapsed

                        const createdAt = new Date(auction.auction.created); // Original creation date
                        const lastSeenAt = new Date(auction.auction.owner.last_seen); // Last seen date
                        const currentTime = new Date(); // Current time
                        
                        // Determine the effective start time
                        const effectiveStartTime = createdAt > lastSeenAt ? createdAt : lastSeenAt;
                        
                        // Calculate the time elapsed since the effective start time
                        const timeElapsedSinceEffectiveStart = currentTime - effectiveStartTime;
                        const hours = Math.floor(timeElapsedSinceEffectiveStart / (1000 * 60 * 60));
                        const minutes = Math.floor((timeElapsedSinceEffectiveStart % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeElapsedSinceEffectiveStart % (1000 * 60)) / 1000);
                        
                        // Format the time elapsed string
                        const timeElapsedString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        
                        // Update the Time Elapsed cell
                        timeElapsedCell.textContent = timeElapsedString;
                        
                        const linkCell = document.createElement('td');
                        const linkButton = document.createElement('button');
                        linkButton.textContent = "SNIPE"
    
                        linkButton.onclick = () => {
                            const textToCopy = `/w ${auction.auction.owner.ingame_name} WTB [${auction.weapon.replace("_", " ")}] Riven for ${auction.auction.starting_price} Platinum (From Riven Shark)`;
                            navigator.clipboard.writeText(textToCopy).then(() => {
                                console.log('Text copied to clipboard!');
    
                                // Create a popup notification
                                const popup = document.createElement('div');
                                popup.className = 'popup';
                                popup.textContent = 'Ctrl + V in game chat!';
                                document.body.appendChild(popup);
                          
                              // Auto-remove the popup after 2 seconds
                              setTimeout(() => {
                                popup.remove();
                              }, 2000);
                            }).catch((err) => {
                              console.error('Failed to copy text: ', err);
                            });
                          };
                        linkCell.appendChild(linkButton);
                        row.appendChild(linkCell);
                        
                        const trackCell = document.createElement('td');
                        const trackButton = document.createElement('button');
                        trackButton.textContent = 'Track'
                        trackButton.onclick = () => {
                            addtodashboard(weaponCell.textContent, true);
                        }

                        trackCell.appendChild(trackButton);
                        row.appendChild(trackCell);

                        //  Add the row to the table
                        tableBody.appendChild(row);
                        
                        sortTable();
                    }
                });

                batchCount++; // Incrementa o contador de lotes
            }
    
            console.log(`Total lowest price ingame auctions fetched: ${allAuctions.length}`);
            loadingIcon.style.scale = '0';
            document.getElementById('loading-table').style.opacity = '0';
            cachedAuctions = allAuctions;
            lastFetchTime = currentTime;
    
            // Call fetchAllWeaponAuctions again after a short delay
            setTimeout(fetchAllWeaponAuctions, 0); // 1 minute delay
            console.log("RESTARTING");
            return allAuctions;
        } catch (error) {
            console.error('Error fetching all weapon auctions:', error);
            loadingIcon.style.scale = '0';
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
        document.getElementById("loading-table").style.display = "block";
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

//search function
// Get the input field and the table body
const searchInput = document.getElementById('search-input');
const tableBody = document.querySelector('#all-weapon-data table tbody');

function search(){
  const searchValue = searchInput.value.toLowerCase();

  // Loop through each row in the table body
  Array.from(tableBody.rows).forEach((row) => {
    const weaponName = row.cells[0].textContent.toLowerCase();

    // Check if the weapon name contains the search value
    if (weaponName.includes(searchValue)) {
      // If it does, set the row to enabled
      row.style.display = '';
    } else {
      // If it doesn't, set the row to disabled
      row.style.display = 'none';
    }
});

}

// Add an event listener to the input field
searchInput.addEventListener('input', () => {
    search();
  });


 // Make showWeapons globally accessible
 window.showWeapons = weaponsModule.showWeapons;