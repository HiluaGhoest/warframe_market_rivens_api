const { ipcRenderer, clipboard } = require('electron');
let popups = []; // Array to keep track of popups
const MAX_POPUP_ID = 9; // Set a maximum limit for popup IDs
let popupIdCounter = 0; // Counter for unique popup IDs

// Listen for the update-overlay event
ipcRenderer.on('update-overlay', (event, data) => {
    updateOverlay(data);
});

// Ouvir pelo evento 'get-snipe-command'
ipcRenderer.on('get-snipe-command', (event, index) => {
    triggerSnipeAuction(index);
});

// Função para tratar a lógica do snipe auction com base no índice
async function triggerSnipeAuction(index) {
    const storedText = document.getElementById(`snipe-command-${index}`).textContent; // Obtém o texto do elemento
    console.log(storedText);
    snipeAuction(storedText); // Chama sua função de leilão
    console.log(`Snipe auction triggered for auction ${index}`);
}

// Função que lida com o snipe
function snipeAuction(text) {
    clipboard.writeText(text); // Usa a API do Electron para copiar para a área de transferência
    console.log('Text copied to clipboard!');
}

// Função para atualizar o overlay com as informações recebidas
function updateOverlay(data) {
    // Obtenha o JSON dos sliders do localStorage
    const slidersData = JSON.parse(localStorage.getItem("slidersData"));

    // Verifique se o threshold está disponível no localStorage; caso contrário, use 0
    const priceThreshold = slidersData && slidersData["overlay-threshold-slider"] ? slidersData["overlay-threshold-slider"] : 0;
    
    if (data.previousLowestPrice !== null && Math.abs(data.price - data.previousLowestPrice) <= priceThreshold) {
        console.log(data.price);
        console.log(data.previousLowestPrice);
        return;
    }

    const popupWrapper = document.getElementById("popupWrapper");

    // Cria um novo elemento de popup
    const popup = document.createElement('div');
    popup.className = "popup-byJS";
    
    // Use the popupIdCounter to create a unique ID for this popup
    const popupId = popupIdCounter % MAX_POPUP_ID; // Cycle the ID using modulo
    popupIdCounter++; // Increment the counter for the next popup

    let previousLowestPrice = data.previousLowestPrice !== null ? data.previousLowestPrice : ""; // Corrigido
    popup.innerHTML = `
        <div id="priceChangePopup-${data.weapon}-${popupId}" class="priceChangePopup">
          <p>Price changed: ${data.weapon.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
          <br>
          <div id="popupPriceWrapper">
              <div>
              <p id="price_popup_text-${popupId}" class="price_popup_text">New price: ${data.price}</p>
              <p id="previousPrice_popup_text">Previous: ${previousLowestPrice}</p>
              </div>
              <img src="../images/platinum.webp" class="priceWrapperPlatinumImage">
              <p class="snipe-command">Press Ctrl + ${popupId + 1}</p>
              <p id="snipe-command-${popupId}" style="display: none;">${data.text}</p>
          </div>
        </div>
    `;

    // Verifica se o popupWrapper existe para evitar erros
    if (popupWrapper) {
        popupWrapper.appendChild(popup);
        popups.push(popup); // Add the new popup to the array

        // Altera a cor do preço e toca o som baseado no preço anterior
        if (data.previousLowestPrice !== null) {
            const priceText = document.getElementById(`price_popup_text-${popupId}`);

            if (data.price > data.previousLowestPrice) {
                priceText.style.color = "green";
                playSound('../audio/raise.mp3');
                console.log("should have raise sound");
            } else if (data.price < data.previousLowestPrice) {
                priceText.style.color = "red";
                playSound('../audio/drop.mp3');
                console.log("should have drop sound");
            }
        }

        // Remover o popup após 20 segundos
        
        // Obtenha o JSON dos sliders do localStorage
        const slidersData = JSON.parse(localStorage.getItem("slidersData"));
        
        // Verifique se o volume está disponível no localStorage; caso contrário, use 0.5
        const popupDuration = slidersData && slidersData["overlay-duration-slider"] ? slidersData["overlay-duration-slider"] * 1000 : 20 * 1000;

        setTimeout(() => {
            popup.classList.add('removePopup');
        }, popupDuration);
        setTimeout(() => {
            popup.remove(); // Remove o popup diretamente
            popups.splice(popups.indexOf(popup), 1); // Remove the popup from the array
        }, popupDuration);
    }
}

// Placeholder for the playSound function
function playSound(audioFilePath) {
    // Obtenha o JSON dos sliders do localStorage
    const slidersData = JSON.parse(localStorage.getItem("slidersData"));
    
    // Verifique se o volume está disponível no localStorage; caso contrário, use 0.5
    const volumeLevel = slidersData && slidersData["overlay-volume-slider"] ? slidersData["overlay-volume-slider"] / 100 : 0.5;

    const audio = new Audio(audioFilePath);
    audio.volume = volumeLevel; // Aplica o volume
    audio.play();
}