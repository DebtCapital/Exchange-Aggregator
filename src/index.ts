import {
  Binance,
  Bitfinex,
  Bitmex,
  CoinbasePro,
  Bybit,
  BinanceFutures,
  Exchanges,
} from "./Modules/Exchanges";

import { Server } from "./Modules/Server";
const WebSocketServer = Server;

Exchanges.start([CoinbasePro, BinanceFutures, Binance, Bitmex, Bybit, Bitfinex]);
