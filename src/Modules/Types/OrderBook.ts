import { OrderBookSide } from "./OrderBookSide";

export type OrderBook = {
  SELL?: OrderBookSide;
  BUY?: OrderBookSide;
};
