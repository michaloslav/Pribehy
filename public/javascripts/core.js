import cart1 from "./cart1";
import errorPage from "./error";
import cart2 from "./cart2";

export default function runScript(currentPage) {
    const pages = {
        cart1: cart1,
        cart2: cart2,
        error: errorPage
    };

    const script = pages[currentPage];

    if (script instanceof Function) {
        script();
    }
}