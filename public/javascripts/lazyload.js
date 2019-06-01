export default class Lazyload {
    static get bookLazyloadConfig () {
        return [{
            rootMargin: "150px",
            placeholder: location.origin + "/images/book_placeholder.svg"
        }, "[alt=book]"];
    }
}