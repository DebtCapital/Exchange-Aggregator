import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";

export class CoinbasePro extends BaseExchange {
  constructor() {
    super(ExchangeType.WebSocket, "wss://ws-feed.pro.coinbase.com", true, "", 0, false);
  }
  subscribe() {
    /*
    const message = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1,
    };*/

    // maybe all pair support?
    const message = {
      type: "subscribe",
      channels: [
        {
          name: "matches",
          product_ids: this.tickers,
        },
      ],
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {
    const { data } = await axios.get("https://api.pro.coinbase.com/products");

    var tickers: Array<string> = [];
    data.forEach((element: any) => {
      this.tickers.push(element.id);
    });
    this.subscribe();
  }
  tradehandler(message: any) {
    const trade: TradeEntity = {
      timestamp: Date.parse(message.time),
      size: message.size,
      price: message.price,
      ticker: message.product_id,
    };
    // this.logger.log(JSON.stringify(trade), "Trade", trade.timestamp)
    this.addTransaction(trade);
  }
  onMessage(message: any) {
    switch (message.type) {
      case "match": {
        //console.log("trade");
        this.tradehandler(message);
        break;
      }
      case "orderBookL2": {
        console.log("book");
        break;
      }
    }
  }
}
