import { ExchangeType } from "../Enums/ExchangeType";
import WebSocket from "isomorphic-ws";
import {
  OrderBook,
  OrderBookEntity,
  OrderBookSide,
  OHLCVEntity,
  TradeEntity,
} from "../Types";

import Logger from "../Utils/Logger";
import { Server as WebSocketServer } from "../Server";
import { WebSocketChannels } from "../Enums/WebSocketChannels";
import { OHLCV } from "../OHLCV";
export abstract class BaseExchange {
  // orderbooks
  // ohlc[v]
  // chcemy tick charts? idk possibly
  // second-based interval charts
  /// https://www.npmjs.com/package/websocket

  // {"op": "subscribe", "args": ["orderBookL2_200"]} <- bybit
  public last_update = new Date().getTime();
  public last_ping = 0;
  public last_ping_response = 0;
  private connection;
  public tickers: Array<string> = [];
  public orderbook: Record<string, OrderBook> = {};
  public ohlcv: Array<OHLCVEntity> = [];
  public trades: Array<TradeEntity> = [];
  public logger = new Logger(this.exchangeName);
  private ohlcvLedger = new OHLCV(this.exchangeName);

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
  init(){
    this.logger.log("Initializing...");
    if (this.type === ExchangeType.WebSocket) {
      this.connection = new WebSocket(this.url);
      this.connection.onopen = this._onConnected;
      this.connection.onmessage = this._onMessage;
      this.connection.onclose = this._onDisconnect;
    }
  }

  //abstract onPing(nig: WebSocket, nog: string): void;
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
    
    this.logger.error("Connection lost, reconnecting");
    this.init();
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
    var message = ""

    try{
      message = JSON.stringify(JSON.parse(payload), null, 4);
    }
    catch(e){
      message = JSON.stringify((payload), null, 4);
    }
    
    //this.logger.log(`Received a message: \n${message}`);
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
    this.ohlcvLedger.addTrade(trade);
  }

  updateBook(ticker:string, precision = 10){
    // time 
    if(this.last_update+500 < new Date().getTime()){
      //this.last_update = new Date().getTime();
      //var message = {buy: this.orderbook[ticker].BUY, sell: this.orderbook[ticker].SELL}
      var message = this.aggregateOrderBook({ asks: this.orderbook[ticker].BUY, bids: this.orderbook[ticker].SELL }, precision)
      WebSocketServer.broadcast(
        WebSocketChannels.BOOKS,
        message,
        (sub: any) => {
          return sub.pair == ticker && sub.exchange == this.exchangeName.toUpperCase();
        },
        this.exchangeName
      )
    }
  }
  printBook(ticker: string) {
    console.clear();

    var nigs = [];
    const books = this.aggregateOrderBook(
      { asks: this.orderbook[ticker].BUY, bids: this.orderbook[ticker].SELL },
      10
    );
    for (let i = 0; i < Math.max(books.buy.length, books.sell.length); i++) {
      const str1 =
        i < books.buy.length
          ? `${books.buy[i].startPrice} ${books.buy[i].endPrice} ${books.buy[i].size}`
          : "          ";
      const str2 =
        i < books.sell.length
          ? `${books.sell[i].startPrice} ${books.sell[i].endPrice} ${books.sell[i].size}`
          : "";
      console.log("\x1b[32m" + str1, "\x1b[31m" + str2, "\x1b[0m");
    }
  }
}
