import WolfuixElemFactory from "wolfuix/js/dom/WolfuixElemFactory";

const elements = WolfuixElemFactory.getElems({
  discountPercentage: "discountPercentage",
  discount: "discount",
  priceAfterDiscount: "priceAfterDiscount",
  totalPrice: "totalPrice",
  priceTimesPieces: ".priceTimesPieces"
}, false);

//TODO: I suppose we should remove showPercentage parameter since it is unused in the following function:
export function calculateDiscount (totalPieces, totalPrice, showPercentage) {
  const discountPercentage = getDiscountPercentage(totalPieces);
  const discount = getDiscount(totalPrice, discountPercentage);

  if (elements.discountPercentage) {
    elements.discountPercentage.innerHTML = discountPercentage * 100;
  }
  elements.discount.innerHTML = discount;
  elements.priceAfterDiscount.innerHTML = getPriceAfterDiscount(elements);
}

export function updateTotalPrice () {
  let totalPrice = 0;
  [...elements.priceTimesPieces].forEach(el => {
    totalPrice += parseInt(el.innerText);
  });
  elements.totalPrice.innerHTML = totalPrice;
  return totalPrice;
}

function getPriceAfterDiscount ({ totalPrice, discount }) {
  return parseInt(totalPrice.innerText) - parseInt(discount.innerText);
}

function getDiscount (totalPrice, discountPercentage) {
  return Math.round(totalPrice * discountPercentage)
}

function getDiscountPercentage (totalPieces) {
  const highestDiscount = .15;
  // Discount is determined by the number of ordered books
  const discountRates = {
    1: 0,
    2: .1
  };
  const regularDiscount = discountRates[totalPieces];
  return regularDiscount === void 0 ? highestDiscount : regularDiscount;
}