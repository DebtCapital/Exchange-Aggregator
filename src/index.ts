import { Binance } from "./Modules/Exchanges/Binance";
import { Bitfinex } from "./Modules/Exchanges/Bitfinex";
import { Bybit } from "./Modules/Exchanges/Bybit";
import { Server } from "./Modules/Server";
// Gotta assign this mfer or it wont init ????
const WebSocketServer = Server;
new Binance();
const test = new Bybit();
