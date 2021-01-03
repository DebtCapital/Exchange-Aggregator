import { ExchangeType } from "../Enums/ExchangeType";
import WebSocket from "isomorphic-ws";
import { OrderBook } from "../Types/OrderBook";
import { OHLCVEntity } from "../Types/OHLCVEntity";
import { TradeEntity } from "../Types/TradeEntity";
import Logger from "../Utils/Logger";
import chalk from "chalk";
export abstract class BaseExchange {
  // orderbooks
  // ohlc[v]
  // chcemy tick charts? idk possibly
  // second-based interval charts
  /// https://www.npmjs.com/package/websocket

  // {"op": "subscribe", "args": ["orderBookL2_200"]} <- bybit
  private connection;
  public orderbook: OrderBook = { SELL: [], BUY: [] };
  public ohlcv: Array<OHLCVEntity> = [];
  public trades: Array<TradeEntity> = [];
  private logger = new Logger(this.constructor.name);

  constructor(private type: ExchangeType, private url: string) {
    this.logger.log("Initializing...");
    if (this.type === ExchangeType.WebSocket) {
      this.connection = new WebSocket(url);
      this.connection.onopen = this._onConnected;
      this.connection.onmessage = this._onMessage;
      this.connection.onclose = this._onDisconnect;
    }
  }
  aggregateOrderBookSide(
    orderbookSide: Array<any>,
    precision: number,
    buy: boolean
  ): void {
    const amounts: any = {};

    for (let i = 0; i < orderbookSide.length; i++) {
      const ask = orderbookSide[i];
      //CCXT = NIGGERS
      const price = Math.floor(ask.price / precision) * precision;
      amounts[price] = (amounts[price] || 0) + ask.size;
    }

    Object.keys(amounts).forEach((price) => {
      // this.orderbook[buy ? "BUY" : "SELL"]?.push({
      //   id: "TEST",
      //   startPrice: parseFloat(price),
      //   endPrice: parseFloat(price) + (precision || 0),
      //   size: amounts[price],
      // });
    });
  }

  aggregateOrderBook(orderbook: Record<string, Array<any>>, precision: number) {
    this.aggregateOrderBookSide(orderbook["asks"], precision, true);
    this.aggregateOrderBookSide(orderbook["bids"], precision, false);
    console.log(this.orderbook);
  }
  abstract onConnected(): void;

  _onDisconnect = () => {
    console.log(this.constructor.prototype.name, "Connection lost");
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

  addTransaction(trade: TradeEntity) {
    this.trades.push(trade);
  }
}