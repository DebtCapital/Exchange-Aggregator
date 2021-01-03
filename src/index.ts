import { Binance } from "./Modules/Exchanges/Binance";
import { Bybit } from "./Modules/Exchanges/Bybit";
import { Server } from "./Modules/Server";
// Gotta assign this mfer or it wont init ????
const WebSocketServer = Server;
new Binance();
const test = new Bybit();
