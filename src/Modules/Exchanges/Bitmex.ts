import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";

export class Bitmex extends BaseExchange {

  constructor() {
    super(ExchangeType.WebSocket, "wss://www.bitmex.com/realtime", true, 'ping', 3000, true);
  }
  subscribe(tickers: any) {
    /*
    const message = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1,
    };*/
    const message = {
      op: "subscribe",
      //args: ['orderBookL2:XBTUSD']
      args: tickers
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {
    const { data } = await axios.get("https://www.bitmex.com/api/v1/Instrument/active");
    data.forEach((element:any) => {
        this.tickers.push(element.symbol);
    });
    // idk why but i have to divide it because mex doesnt like the whole array
    const half = Math.ceil(this.tickers.length / 2);
    
    const half2 = this.tickers.splice(0, half ).map((element: string) => {return "trade:"+element})
    const half1 = this.tickers.splice(-half ).map((element: string) => {return "trade:"+element})
    this.subscribe(half2)
    this.subscribe(half1);
  }
  tradehandler(message: any){

      message.data.forEach((element:any) => {
          const trade = {
            timestamp: Date.parse(element.timestamp),
            ticker: element.symbol,
            size:element.size,
            price:element.price,
            side:element.side.toLowerCase()
        };
        //this.logger.log(JSON.stringify(trade), "Trade", trade.timestamp)
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
