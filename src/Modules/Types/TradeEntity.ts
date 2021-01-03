import { TradeType } from "../Enums/TradeType";

export type TradeEntity = {
  timestamp: number;
  ticker: string;
  size: number;
  price: number;
};
