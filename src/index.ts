import { Binance } from "./Modules/Exchanges/Binance";
import { Bitmex } from "./Modules/Exchanges/Bitmex";
import { Bitfinex } from "./Modules/Exchanges/Bitfinex";
import { CoinbasePro } from "./Modules/Exchanges/CoinbasePro";
import { Bybit } from "./Modules/Exchanges/Bybit";
import { Server } from "./Modules/Server";
// Gotta assign this mfer or it wont init ????
const WebSocketServer = Server;
//const bb = new Binance();
const test = new Bybit();
//const nig = new Bitfinex()

//const mex = new Bitmex();

//const cbpro = new CoinbasePro();
