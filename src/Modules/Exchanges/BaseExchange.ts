import { ExchangeType } from "../Enums/ExchangeType";
import WebSocket from "isomorphic-ws";
import { OrderBook } from "../Types/OrderBook";
import { OHLCVEntity } from "../Types/OHLCVEntity";
import { TradeEntity } from "../Types/TradeEntity";
import { OrderBookSide } from "../Types/OrderBookSide";
import { OrderBookEntity } from "../Types/OrderBookEntity";
import Logger from "../Utils/Logger";
import { Server as WebSocketServer } from "../Server";
import { WebSocketChannels } from "../Enums/WebSocketChannels";
export abstract class BaseExchange {
  // orderbooks
  // ohlc[v]
  // chcemy tick charts? idk possibly
  // second-based interval charts
  /// https://www.npmjs.com/package/websocket

  // {"op": "subscribe", "args": ["orderBookL2_200"]} <- bybit
  private connection;
  public orderbook: Record<string, OrderBook> = {};
  public ohlcv: Array<OHLCVEntity> = [];
  public trades: Array<TradeEntity> = [];
  public logger = new Logger(this.exchangeName);

  constructor(
    private type: ExchangeType,
    private url: string,
    public tick: boolean
  ) {
    this.logger.log("Initializing...");
    if (this.type === ExchangeType.WebSocket) {
      this.connection = new WebSocket(url);
      this.connection.onopen = this._onConnected;
      this.connection.onmessage = this._onMessage;
      this.connection.onclose = this._onDisconnect;
    }
  }
  aggregateOrderBookSide(
    orderbookSide: OrderBookSide,
    precision: number,
    buy: boolean
  ): Array<OrderBookEntity> {
    const amounts: any = {};
    var ret: Array<OrderBookEntity> = [];
    for (let i = 0; i < orderbookSide.length; i++) {
      const ask = orderbookSide[i];
      //CCXT = NIGGERS
      const price = Math.floor(ask.startPrice / precision) * precision;
      amounts[price] = (amounts[price] || 0) + ask.size;
    }

    Object.keys(amounts).forEach((price) => {
      ret.push({
        id: "",
        startPrice: parseFloat(price),
        endPrice: parseFloat(price) + (precision || 0),
        size: amounts[price],
      });
    });
    return ret;
  }
  aggregateOrderBook(
    orderbook: Record<string, OrderBookSide>,
    precision: number
  ) {
    var buy = this.aggregateOrderBookSide(orderbook["asks"], precision, true);
    var sell = this.aggregateOrderBookSide(orderbook["bids"], precision, false);
    return { buy, sell };
  }
  abstract onConnected(): void;

  _onDisconnect = () => {
    this.logger.error("Connection lost");
  };
  _onConnected = () => {
    this.logger.success("Connected to: " + this.url);
    this.onConnected();
  };

  _onMessage = (payload: WebSocket.MessageEvent): void => {
    this.onMessage(JSON.parse(payload.data.toString()));
  };
  abstract onMessage(message: object): void;

  send(payload: string) {
    if (!this.connection) throw new Error("Can't send without connection!");
    const message = JSON.stringify(JSON.parse(payload), null, 4);
    this.logger.log(`Received a message: \n${message}`);
    this.connection.send(payload);
  }
  get exchangeName(): string {
    return this.constructor.name;
  }
  addTransaction(trade: TradeEntity) {
    this.trades.push(trade);
    WebSocketServer.broadcast(
      WebSocketChannels.TRADES,
      trade,
      (sub: any) => {
        return sub.pair === trade.ticker;
      },
      this.exchangeName
    );
  }
  printBook(ticker: string) {
    console.clear();

    var nigs = []
    const books = this.aggregateOrderBook({asks: this.orderbook[ticker].BUY, bids: this.orderbook[ticker].SELL}, 10);
    for(let i = 0; i < Math.max(books.buy.length, books.sell.length); i++){
      const str1 = i < books.buy.length? `${books.buy[i].startPrice} ${books.buy[i].endPrice} ${books.buy[i].size}`: "          ";
      const str2 = i < books.sell.length? `${books.sell[i].startPrice} ${books.sell[i].endPrice} ${books.sell[i].size}` : "";
      console.log("\x1b[32m"+str1, "\x1b[31m"+str2, '\x1b[0m');
    }

  }
}
