import { calculatePrices, updatePiecesOnEvent } from "./cart1Core";

export default function cart1() {
  // get the initial prices
  calculatePrices();

  updatePiecesOnEvent("click");
  updatePiecesOnEvent("change")
}