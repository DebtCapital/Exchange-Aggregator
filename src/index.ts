import {
  Binance,
  Bitfinex,
  Bitmex,
  CoinbasePro,
  Bybit,
  BinanceFutures,
  Exchanges,
  BybitUSDT,
} from "./Modules/Exchanges";

import { Server } from "./Modules/Server";
const WebSocketServer = Server;

Exchanges.start([BinanceFutures, Binance, Bitmex, Bybit, BybitUSDT]);
