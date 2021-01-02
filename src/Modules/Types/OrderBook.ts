import { OrderBookEntity } from "./OrderBookEntity";

export type OrderBook = {
  SELL?: Array<OrderBookEntity>;
  BUY?: Array<OrderBookEntity>;
};
