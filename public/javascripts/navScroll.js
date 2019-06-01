import WolfuixElemTools from "wolfuix/js/dom/WolfuixElemTools";
import { scrollToY } from "./scroll";

export default function enableNavScroll () {
    setCallbackForAnchors("[data-allow-navScroll]", anchor => {
        anchor.onclick = e => anchorOnClick(anchor, e);
    });

    enableScrollSpy();
}

function anchorOnClick (anchor, e) {
    e.preventDefault();
    try {
        document.querySelector(".nav-link.active").classList.remove("active");
    }
    catch (e) {}
    anchor.classList.add("active");
    const id = getIdFromHref(anchor);
    const { topAbsolute } = WolfuixElemTools.getElementPosition(id);
    scrollToY(topAbsolute);
    return false;
}

function getIdFromHref (element) {
    const { href } = element;
    return href.slice(href.indexOf("#") + 1);
}

function setCallbackForAnchors (selector, callback) {
    const anchors = [...document.querySelectorAll(selector)];

    anchors.forEach(anchor => {
        callback(anchor);
    });
}

function enableScrollSpy () {
    const anchors = [...document.querySelectorAll("[data-scrollspy-anchor]")];
    window.onscroll = () => {
        try {
            const bounds = anchors.map(anchor => {
                const element = document.getElementById(getIdFromHref(anchor));
                return Math.abs(element.getBoundingClientRect().top);
            });

            const minimum = Math.min(...bounds);
            const currentAnchor = document.querySelector(".nav-link.active");
            const newAnchor = anchors[bounds.indexOf(minimum)];

            if (currentAnchor !== newAnchor) {
                if (currentAnchor) {
                    currentAnchor.classList.remove("active");
                }
                newAnchor.classList.add("active");
            }
        } catch (e) {
            window.onscroll = null;
        }
    };

    if (window.onscroll) {
        onscroll();
    }
}