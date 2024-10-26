const { ipcRenderer, clipboard } = require('electron');

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
    const childNumber = document.getElementById("popupWrapper").children.length + 1;

    const popupWrapper = document.getElementById("popupWrapper");

    // Cria um novo elemento de popup
    const popup = document.createElement('div');
    popup.className = "popup-byJS";
    let previousLowestPrice = data.previousLowestPrice !== null ? data.previousLowestPrice : ""; // Corrigido
    popup.innerHTML = `
        <div id="priceChangePopup-${data.weapon}-${childNumber}" class="priceChangePopup">
          <p>Price changed: ${data.weapon.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
          <br>
          <div id="popupPriceWrapper">
              <div>
              <p id="price_popup_text-${childNumber}" class="price_popup_text">New price: ${data.price}</p>
              <p id="previousPrice_popup_text">Previous: ${previousLowestPrice}</p>
              </div>
              <img src="../images/platinum.webp" class="priceWrapperPlatinumImage">
              <p class="snipe-command">Press Ctrl + ${childNumber}</p>
              <p id="snipe-command-${childNumber}" style="display: none;">${data.text}</p>
          </div>
        </div>
    `;

    // Verifica se o popupWrapper existe para evitar erros
    if (popupWrapper) {
        popupWrapper.appendChild(popup);

        // Altera a cor do preço e toca o som baseado no preço anterior
        if (data.previousLowestPrice !== null) {
            const priceText = document.getElementById(`price_popup_text-${childNumber}`);

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
        setTimeout(() => {
            popup.classList.add('removePopup');
        }, 19500);
        setTimeout(() => {
            popup.remove(); // Remove o popup diretamente
        }, 20000);
    }
}

// Placeholder for the playSound function (implement this function elsewhere in your code)
function playSound(audioFilePath) {
    const audio = new Audio(audioFilePath);
    audio.play();
}
