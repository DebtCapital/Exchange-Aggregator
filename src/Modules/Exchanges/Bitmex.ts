import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";

export class Bitmex extends BaseExchange {
  constructor() {
    super(ExchangeType.WebSocket, "wss://www.bitmex.com/realtime", true);
  }
  subscribe(tickers: any) {
    /*
    const message = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1,
    };*/
    console.log(tickers)
    const message = {
      op: "subscribe",
      //args: ['orderBookL2:XBTUSD']
      args: tickers
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {
    const { data } = await axios.get("https://www.bitmex.com/api/v1/Instrument/active");
    //console.log(data);
    var subs: Array<string> = []
    data.forEach((element:any) => {
        subs.push("trade:"+element.symbol)
    });
    console.log(subs)

    // idk why but i have to divide it because mex doesnt like the whole array
    const half = Math.ceil(subs.length / 2);
    const half2 = subs.splice(0, half )
    const half1 = subs.splice(-half )
    //
    this.subscribe(half2)
    this.subscribe(half1);
  }
  tradehandler(message: any){
      //if(message.action != "insert"){
        //console.log(message);
      //}
      //console.log(message)
      message.data.forEach((element:any) => {
          const trade = {
            timestamp: Date.parse(element.timestamp),
            ticker: element.symbol,
            size:element.size,
            price:element.price
        };
        this.logger.log(JSON.stringify(trade), "Trade", trade.timestamp)
        this.addTransaction(trade);
      });
      
  }
  onMessage(message: any) {
    switch(message.table){
        case "trade":{
            //console.log("trade");
            this.tradehandler(message);
            break;
        }
        case "orderBookL2":{
            console.log("book");
            break;
        }

    }
  }

  
  
}
