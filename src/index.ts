import { Binance, Exchanges } from "./Modules/Exchanges";

import { Server } from "./Modules/Server";
const WebSocketServer = Server;

Exchanges.start([[Binance]]);
