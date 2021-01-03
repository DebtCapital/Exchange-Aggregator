import { Binance } from "./Modules/Exchanges/Binance";
import { Bitfinex } from "./Modules/Exchanges/Bitfinex";
import { Bybit } from "./Modules/Exchanges/Bybit";
import { WebSocketServer } from "./Modules/Server/WebSocketServer";

//new Binance();
//const test = new Bybit();
const bfx = new Bitfinex();
const server = new WebSocketServer();
