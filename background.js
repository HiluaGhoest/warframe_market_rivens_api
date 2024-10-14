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
