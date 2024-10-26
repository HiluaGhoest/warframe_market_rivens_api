var connectionMessage = "internet connected, API is ready to go.";
var noConnectionMessage = "No internet connection, please ensure your device is connected to the internet.";
window.onload = checkInternetConnection;
function checkInternetConnection() {
  var isOnLine = navigator.onLine;
   if (isOnLine) {
      // alert(connectionMessage);
   } else {
     alert(noConnectionMessage);
   }
}

// In your MainWindow JavaScript code

// Request to show and move the overlay window
ipcRenderer.send('show-overlay');
