import { calculateDiscount, updateTotalPrice } from "./cartCalculation";
import { scrollToY } from "./scroll";
import WolfuixFormData from "wolfuix/js/lib/WolfuixFormData";
import WolfuixElemTools from "wolfuix/js/dom/WolfuixElemTools";

export default function cart2 () {
  const form = document.getElementById("cart2-form");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new WolfuixFormData(form);
    fetch("/cart/formValidator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: formData.toJSON()
    }).then(result => result.json())
      .then(json => validateFormCallback(json, form));
  });

// get the initial prices
  let totalPrice = updateTotalPrice();
  let totalPieces = 0;
  [...document.getElementsByClassName("piecesInTable")].forEach(piece => {
    totalPieces += parseInt(piece.innerText);
  });
  calculateDiscount(totalPieces, totalPrice);
}

function validateFormCallback ({ result, errorMessages }, form) {
  if (result) {
    form.submit();
  }
  else {
    const errorMessageClass = "cart2-form-error-message";
    const previousErrorMessages = [...document.getElementsByClassName(errorMessageClass)];

    previousErrorMessages.forEach(errMessage => {
      errMessage.parentElement.removeChild(errMessage);
    });

    Object.entries(errorMessages).forEach(([name, message]) => {
      const span = document.createElement("div");
      span.className = errorMessageClass;
      span.innerText = message;
      document.querySelector(`input[name=${name}]`).parentElement.append(span);
    });

    const [firstInvalidInput] = Object.keys(errorMessages);
    const input = document.querySelector(`[name=${firstInvalidInput}]`);
    scrollToY(WolfuixElemTools.getElementPosition(input).topAbsolute - 90);
  }
}