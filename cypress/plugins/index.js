module.exports = (on, config) => {
    return Object.assign({}, config, {
        viewportWidth: 1024,
        viewportHeight: 600,
        baseUrl: "http://localhost:3000"
    });
};