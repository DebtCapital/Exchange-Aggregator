import { Binance,BybitUSDT, Bitmex, CoinbasePro, Exchanges } from "./Modules/Exchanges";

import { Server } from "./Modules/Server";
const WebSocketServer = Server;

Exchanges.start([[CoinbasePro]]);
