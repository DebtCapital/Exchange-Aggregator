import {
  Binance,
  Bitfinex,
  Bitmex,
  CoinbasePro,
  Bybit,
  Exchanges,
} from "./Modules/Exchanges";

import { Server } from "./Modules/Server";
const WebSocketServer = Server;

Exchanges.start([CoinbasePro, Binance, Bitmex, Bybit, Bitfinex]);
