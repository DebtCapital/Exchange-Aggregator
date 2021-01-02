import { ExchangeType } from "../Enums/ExchangeType";
import WebSocket from "isomorphic-ws";
import { OrderBook } from "../Types/OrderBook";
import { OHLCVEntity } from "../Types/OHLCVEntity";
import { TradeEntity } from "../Types/TradeEntity";
import { OrderBookEntity } from "../Types/OrderBookEntity";

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

  constructor(private type: ExchangeType, private url: string) {
    if (this.type === ExchangeType.WebSocket) {
      this.connection = new WebSocket(url);
      this.connection.onopen = this._onConnected;
      this.connection.onmessage = this._onMessage;
      this.connection.onclose = (aa: any) => {
        console.log(aa);
      };
    }
  }
  aggregateOrderBookSide(
    orderbookSide: Array<any>,
    precision: number,
    buy: boolean
  ): Array<OrderBookEntity> {
    const result: Array<any> = [];
    const amounts: any = {};
    const sizes: Array<number> = [];
    for (let i = 0; i < orderbookSide.length; i++) {
      const ask = orderbookSide[i];
      //CCXT = NIGGERS
      const price = Math.floor(ask.price / precision) * precision
      /// this code signifies me (dominik) going into a braindead coma
      amounts[price] = (amounts[price] || 0) + ask.size;
      sizes.push(ask.size);
    }
    if (buy) {
      Object.keys(amounts).forEach((price) => {
        this.orderbook.BUY?.push({
          startPrice: parseFloat(price),
          endPrice: parseFloat(price) + (precision || 0),
          size: amounts[price],
          sizes,
        });
      });
    } else {
      Object.keys(amounts).forEach((price) => {
        this.orderbook.SELL?.push({
          startPrice: parseFloat(price),
          endPrice: parseFloat(price) + (precision || 0),
          size: amounts[price],
          sizes,
        });
      });
    }

    orderbookSide.forEach((nig) => {
      console.log(nig.price, nig.size); // imma kms
      //run it
      //wut
    });
    console.log("WE SET DIS BITCH");
    const AAAAA = this.orderbook.BUY?.filter((el) => el.startPrice === 29360); // we ======== dumb niggers

    console.log(JSON.stringify(AAAAA, null, 4));
    console.log(this.orderbook);
    return result;
  }

  aggregateOrderBook(orderbook: Record<string, Array<any>>, precision: number) {
    console.log("asks", orderbook["asks"]);
    let asks = this.aggregateOrderBookSide(orderbook["asks"], precision, true);
    //let bids = this.aggregateOrderBookSide(orderbook["bids"], precision, false);
    return {
      asks: asks.sort(function (a, b) {
        return a.size - b.size;
      }),
      // bids: bids.sort(function (a, b) {
      //   return a.size - b.size;
      // }),
    };
  }
  abstract onConnected(): void;

  _onConnected = () => {
    console.log("Connected to:", this.url);
    this.onConnected();
  };

  _onMessage = (payload: MessageEvent) => {
    this.onMessage(JSON.parse(payload.data));
  };
  abstract onMessage(message: object): void;

  send(payload: string) {
    console.log("Sending:", payload);
    this.connection.send(payload);
  }

  addTransaction(trade: TradeEntity) {
    this.trades.push(trade);
  }
}
