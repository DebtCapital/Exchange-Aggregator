import { Binance,BybitUSDT, Bitmex, CoinbasePro, Bitfinex, Exchanges } from "./Modules/Exchanges";

import { Server } from "./Modules/Server";
const WebSocketServer = Server;

Exchanges.start([[Bitfinex]]);
