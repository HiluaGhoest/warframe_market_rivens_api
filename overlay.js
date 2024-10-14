// Register the hotkey listener outside the showPopup function
if (overwolf.settings.hotkeys != null) {
    console.log("overwolf.settings.hotkeys is defined" + overwolf.settings.hotkeys);

    overwolf.settings.hotkeys.onPressed.addListener(function(hotkey) {
        
        console.log("Hotkey pressed: " + hotkey.name);
            switch (hotkey.name) {
                case "snipe_auction_1":
                    triggerSnipeAuction(1);
                    console.log("snipe_auction_1 activated");
                    break;
                case "snipe_auction_2":
                    triggerSnipeAuction(2);
                    console.log("snipe_auction_2 activated");
                    break;
                case "snipe_auction_3":
                    triggerSnipeAuction(3);
                    console.log("snipe_auction_3 activated");
                    break;
                case "snipe_auction_4":
                    triggerSnipeAuction(4);
                    console.log("snipe_auction_4 activated");
                    break;
                case "snipe_auction_5":
                    triggerSnipeAuction(5);
                    console.log("snipe_auction_5 activated");
                    break;
                case "snipe_auction_6":
                    triggerSnipeAuction(6);
                    console.log("snipe_auction_6 activated");
                    break;
                case "snipe_auction_7":
                    triggerSnipeAuction(7);
                    console.log("snipe_auction_7 activated");
                    break;
                case "snipe_auction_8":
                    triggerSnipeAuction(8);
                    console.log("snipe_auction_8 activated");
                    break;
                case "snipe_auction_9":
                    triggerSnipeAuction(9);
                    console.log("snipe_auction_9 activated");
                    break;  
                default:
                    console.log("Unknown hotkey pressed:", hotkey.name);
                    break;
            }

        // Function to handle the snipe auction logic based on the index
        async function triggerSnipeAuction(index) {          
            const storedText = document.getElementById(`snipe-command-${index}`).textContent;
            console.log(storedText)
            snipeAuction(storedText); // Call your auction function
            console.log(`Snipe auction triggered for auction ${index}`);
        }
    });
} else {
    console.error("overwolf.settings.hotkeys is undefined");
}

function snipeAuction(text){
    overwolf.utils.placeOnClipboard(text);
    console.log('text copied to clipboard!');
}


// Get the current window and minimize it
overwolf.windows.getCurrentWindow(function(result) {
    if (result.status === "success") {
      const windowId = result.window.id;
      
      // Minimize the window
      overwolf.windows.minimize(windowId, function(res) {
        if (res.success) {
          console.log("Window minimized successfully!");
        } else {
          console.error("Failed to minimize the window:", res);
        }
      });
    } else {
      console.error("Failed to get current window:", result);
    }
});

overwolf.windows.onStateChanged.addListener(function(event) {
    if (event.window_state === "normal") {
      console.log("Window is now visible");
    } else if (event.window_state === "minimized") {
      console.log("Window is minimized");
    }
  });
  
overwolf.windows.onMessageReceived.addListener((message) => {
    console.log("Received a message")
    overwolf.windows.getCurrentWindow(function(result) {
        if (result.status === "success") {

            const windowId = result.window.id;
            console.log('Message received', message.content)
            overwolf.windows.bringToFront(windowId, console.log);

            const { text, weapon, price, previousLowestPrice, profit } = message.content.detail;
            // Handle the event in the overlay window
            showPopup(text, weapon, price, previousLowestPrice, profit);
            
        } else {
        console.error("Failed to get current window:", result);
        }
  });
});
  // Function to show the popup
  function showPopup(text, weapon, price, previousPrice, profit) {
    console.log('showPopup function called');

    const popup = document.createElement('div');

    const popupWrapper = document.getElementById("popupWrapper");
    const childNumber = popupWrapper.children.length + 1;
   
    popup.innerHTML = `
      <div id="priceChangePopup">
        <p>Price changed: ${weapon}</p>
        <br>
        <div id="popupPriceWrapper">
            <div>
            <p id="price_popup_text">New price: ${price}</p>
            <p id="previousPrice_popup_text">Profit: ${profit}</p>
            </div>
            <img src="images/platinum.webp" class="priceWrapperPlatinumImage">
            <p class="snipe-command">Press Ctrl + ${childNumber}</p>
            <p id="snipe-command-${childNumber}" style="display: none;">${text}</p>
        </div>
      </div>
    `;

    // Check if "popupWrapper" exists to avoid errors
    if (popupWrapper) {
      popupWrapper.appendChild(popup);
    } else {
      console.warn('popupWrapper not found');
      return;
    }
  
    // Handle price change color and sound
    if (previousPrice !== null) {
      const priceText = document.getElementById("price_popup_text");
      
      if (price > previousPrice) {
        priceText.style.color = "green";
        playSound('audio/raise.mp3');
      } else if (price < previousPrice) {
        priceText.style.color = "red";
        playSound('audio/drop.mp3');
      }
    }
  
    console.log("works");
    
    // Make popup visible
    popup.style.opacity = "1";
    
    // Hide the popup after 20 seconds
    setTimeout(() => {
      popup.remove();
        if (popupWrapper.children.length === 0) {
            overwolf.windows.getCurrentWindow(function(result) {
                if (result.status === "success") {
                // const windowId = result.window.id;
                // // Close window
                // overwolf.windows.close(windowId, function(res) {
                //     if (res.success) {
                //     console.log("Window closed successfully!");
                //     } else {
                //     console.error("Failed to close the window:", res);
                //     }
                // });
                } else {
                console.error("Failed to get current window:", result);
                }
            });
        }
    }, 20000);
  }
  
  // Placeholder for the playSound function (implement this function elsewhere in your code)
  function playSound(audioFilePath) {
    const audio = new Audio(audioFilePath);
    audio.play();
  }
  