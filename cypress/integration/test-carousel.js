describe("Carousel test", () => {
    it("Carousel test", () => {
        cy.visit("/");

        scrollToNews(250);

        switchItem("prev");
        switchItem("prev");
        switchItem("next");

        cy.get("#carouselNews [data-cy=carouselIndicator]").each(el => {
            cy.wrap(el).click({ force: true });
            cy.wait(500);
        });

        // test if news in the nav has active class
        cy.get("[data-cy=nav-news].active");

        cy.get(`[data-cy=news-carousel-item].active`);
    });
});

const scrollToNews = (delay = 0) => {
    cy.get("#carouselNews").scrollIntoView();
    cy.wait(delay);
};

const switchItem = direction => {
    cy.get(`[data-cy=news-carousel-slide-${direction}]`).click();
    scrollToNews(500);
};