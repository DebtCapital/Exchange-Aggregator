import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";

export class Binance extends BaseExchange {
  constructor() {
    super(
      ExchangeType.WebSocket,
      "wss://stream.binance.com:9443/ws/stream",
      true
    );
  }
  subscribe(streams: Array<string>) {
    /*
    const message = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1,
    };*/
    const message = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1,
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {
    const { data } = await axios.get(
      "https://www.binance.com/api/v3/ticker/24hr"
    );
    this.tickers = data.map((pair: any) => pair.symbol);
    const pairs = data.map((pair: any) => `${pair.symbol.toLowerCase()}@trade`);;
    const first = pairs.slice(0, 500);
    // const second = pairs.slice(500, 1000);
    this.subscribe(first);
    // this.subscribe(second);

  }
  onMessage(message: any) {
    switch (message.e) {
      case "trade": {
        const trade: TradeEntity = {
          timestamp: message.T,
          price: message.p,
          size: message.q,
          ticker: message.s,
        };
        this.logger.log(JSON.stringify(trade), "Trade");
        this.addTransaction(trade);
      }
      case "depthUpdate": {
      }
    }
  }
}
