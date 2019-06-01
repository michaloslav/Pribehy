// polyfills
import "whatwg-fetch";
import "promise-polyfill/src/polyfill";
import "wolfuix/js/polyfill/Polyfills";
// JS for Bootstrap
import "./bootstrapJS";
// app modules
import runScript from "./core";
import enableNavScroll from "./navScroll";
import MiniLazyload from "minilazyload/minilazyload";
import Lazyload from "./lazyload";
import "./serviceWorker";

const currentPage = document.body.dataset.currentPage;
runScript(currentPage);
enableNavScroll();

// libraries
new MiniLazyload(...Lazyload.bookLazyloadConfig);
