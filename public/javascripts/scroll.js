export function scrollToY (y) {
    const { pageXOffset } = window;
    const options = {
        left: pageXOffset,
        top: y,
        behavior: "smooth"
    };

    window.scroll(options);

    setTimeout(() => {
        if (pageYOffset === 0) {
            window.scroll(...Object.values(options))
        }
    }, 60);
}
