const faker = require("faker");

faker.locale = "cz";

describe("Order test", () => {
    it("Unsuccessful order", () => {
        addToCart(3);

        // fill in some random personal credentials and submit the second form
        fillFormWith(true).forEach(([input, value]) => {
            cy.get(input).type(value);
        });

        submitForm();

        cy.get("#nameInput").scrollIntoView();

        // the validator should stop the form submit and dump the error message
        cy.contains("Neplatné telefonní číslo!");

        cy.wait(4000);
    });

    it("Successful order", () => {
        addToCart(65);

        fillFormWith().forEach(([input, value]) => {
            cy.get(input).type(value);
        });

        submitForm();

        cy.contains("Zboží bylo úspěšně objednáno. Podrobnosti najdete v infomačním e-mailu.");
    });
});

const addToCart = numberOfPieces => {
    cy.visit("/");
    cy.get("[data-cy=addToCart]").first().click();

    const input = cy.get("[data-cy=piecesInput]").first();
    input.type(String(numberOfPieces));

    cy.wait(2000);
    cy.get("#cart1-submit").click();
};

const fillFormWith = invalidPhoneNumber =>
    [
        ["#nameInput", `${faker.name.firstName()} ${faker.name.lastName()}`],
        ["#phoneNumberInput", faker.phone.phoneNumber().replace(/ /g, "").slice(0, invalidPhoneNumber ? 8 : 9)],
        ["#emailInput", faker.internet.email()],
        ["#streetAndHouseNumberInput", faker.address.streetName()],
        ["#zipCodeInput", faker.address.zipCode().replace(/-/g, "")],
        ["#cityInput", faker.address.city()],
    ];


const submitForm = () => {
    cy.get("[data-cy=agreeWithTermsAndConditions]").check();
    cy.get("[data-cy=agreeWithPrivacyPolicy]").check();
    cy.get("#cart2-form").submit();
};