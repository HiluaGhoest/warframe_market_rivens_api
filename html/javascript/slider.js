const sliders = document.querySelectorAll(".slider");
const sliderValues = document.querySelectorAll(".slider-value");

function setSliderValues(id, value) {
    const slidersData = JSON.parse(localStorage.getItem("slidersData")) || {};
    slidersData[id] = value;
    localStorage.setItem("slidersData", JSON.stringify(slidersData));
}

function loadSliderValues() {
    const slidersData = JSON.parse(localStorage.getItem("slidersData")) || {};

    sliders.forEach((slider, index) => {
        const savedValue = slidersData[slider.id];
        if (savedValue !== undefined) {
            slider.value = savedValue;
            sliderValues[index].textContent = savedValue;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadSliderValues();
});

sliders.forEach((slider, index) => {
    slider.oninput = function() {
        sliderValues[index].textContent = this.value;
        setSliderValues(slider.id, this.value);
    }
});
