import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";

export class BinanceFutures extends BaseExchange {
  constructor() {
    super(
      ExchangeType.WebSocket,
      "wss://fstream.binance.com/ws",
      true, 
      "",
      0,
      false
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
    // console.log(JSON.stringify(message))
    this.send(JSON.stringify(message));
    // console.log(JSON.stringify(message))
  }
  async onConnected() {
    const { data } = await axios.get(
      "https://fapi.binance.com/fapi/v1/ticker/24hr"
    );
    this.tickers = data.sort((a: any, b: any) => {
      if (parseFloat(a.quoteVolume) > parseFloat(b.quoteVolume)) {return -1} else {1}
    }).filter((a:any) => a.quoteVolume > 20000000).map((pair: any) => pair.symbol).filter((a: any) =>{ 
      return !a.toLowerCase().endsWith("btc") && !a.toLowerCase().endsWith("bidr")  && !a.toLowerCase().endsWith("idrt") && !a.toLowerCase().endsWith("uah") && !a.toLowerCase().endsWith("eur") && !a.toLowerCase().endsWith("try")&& !a.toLowerCase().endsWith("brl") && !a.toLowerCase().endsWith("rub")&& !a.toLowerCase().endsWith("eth") && !a.toLowerCase().endsWith("bnb") && !a.toLowerCase().endsWith("pax")
  
  });
    // console.log(this.tickers)
    const pairs = this.tickers.map((pair: any) => `${pair.toLowerCase()}@aggTrade`);;
    const first = pairs.slice(0, 500);
    // const second = pairs.slice(500, 1000);
    this.subscribe(first);
    // this.subscribe(second);

  }
  onMessage(message: any) {
    // console.log(message)
    switch (message.e) {
      case "aggTrade": {
        const trade: TradeEntity = {
          timestamp: message.T,
          price: message.p,
          size: message.q,
          ticker: message.s,
        };
        // this.logger.log(JSON.stringify(trade), "Trade");
        this.addTransaction(trade);
      }
      case "depthUpdate": {
      }
    }
  }
}
