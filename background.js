// In your MainWindow JavaScript code
overwolf.windows.obtainDeclaredWindow('OverlayWindow', function(result) {
  if (result.status === "success") {
    overwolf.windows.restore(result.window.id, function() {
      overwolf.windows.changePosition("OverlayWindow", 0, 0, console.log)
    });
  } else {
    console.error("Failed to get window:", result);
  }
});

// Function to set the window size
function setWindowSize() {
  // Get the current window's ID
  overwolf.windows.getCurrentWindow(function (result) {
      if (result.status === "success") {
          // Get screen width and height
          window.screen.width
          window.screen.height

          // Set the window size to the full screen dimensions
          overwolf.windows.changeSize(
              result.window.id,
              window.screen.width,
              window.screen.height,
              function (response) {
                  if (response.status !== "success") {
                      console.error("Failed to resize the window:", response);
                  }
              }
          );
          
      overwolf.windows.changePosition("MainWindow", 0, 0, console.log)
      }
  });
}

// Call the function when the document is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  setWindowSize();
  overwolf.windows.maximize();
});