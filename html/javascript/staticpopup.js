function showPopup(message, stats = false) {
    const popupMessageDiv = document.getElementById('popup-message');
    const popupText = document.getElementById('popup-text');

    // Set the message text
    popupText.textContent = message;

    if (stats) {
        document.getElementById("popup-message").style.backgroundColor ="#5abe67"
    } else {
        document.getElementById("popup-message").style.backgroundColor ="#f8d7da"
    }
    // Show the popup
    popupMessageDiv.style.opacity = '1';

    // Optionally, hide the popup after a few seconds
    setTimeout(() => {
        closePopup();
    }, 3000); // Change 3000 to the desired time in milliseconds
}

function closePopup() {
    const popupMessageDiv = document.getElementById('popup-message');
    popupMessageDiv.style.opacity = '0';
}