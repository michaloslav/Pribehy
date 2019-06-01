import { calculateDiscount, updateTotalPrice } from "./cartCalculation";

export function updatePiecesOnEvent (eventName) {
    getPiecesInputs().forEach(input => {
        input.addEventListener(eventName, ({ target }) => {
            updatePieces(target);
        });
    });
}

// calculates all the prices (including the discount)
export function calculatePrices () {
    // totalPrice
    const totalPrice = updateTotalPrice();
    // discount
    let totalPieces = 0;
    getPiecesInputs().forEach(input => {
        totalPieces += parseInt(input.value);
    });
    calculateDiscount(totalPieces, totalPrice, true);
}

function getPiecesInputs () {
    return [...document.getElementsByClassName("piecesInput")];
}

// when the user changes the piecesInput value
function updatePieces ({ id, value }) {
    // get all the numbers
    const bookID = id.split("_")[1];
    const span = document.getElementById(`priceTimesPieces_${bookID}`);
    const pricePerItem = Number(span.dataset.pricePerItem);

    // update the priceTimesPieces span
    span.innerHTML = pricePerItem * value;

    calculatePrices();

    // AJAX to update the sess var
    fetch("/cart/editItemsInCart", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            bookID: bookID,
            pieces: value
        })
    })
}