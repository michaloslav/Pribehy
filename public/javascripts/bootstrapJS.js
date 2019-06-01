import createCarousel from "./lightweightCarouselForBootstrap";

// flash messages
const closeButtons = [...document.getElementsByClassName("close")];

closeButtons.forEach(close => {
    close.addEventListener("click", () => {
        // because fucking IE doesn't support function remove()
        const parent = close.parentElement;
        parent.parentElement.removeChild(parent);
    });
});

// navbar

const navbarToggler = document.getElementsByClassName("navbar-toggler")[0];
const navbarContent = document.getElementsByClassName("navbar-collapse")[0];

navbarToggler.addEventListener("click", () => {
    if (navbarContent.classList.contains("collapse")) {
        navbarContent.classList.remove("collapse");
    }
    else {
        navbarContent.classList.add("collapse");
    }
});

// carousel

createCarousel("carouselNews");