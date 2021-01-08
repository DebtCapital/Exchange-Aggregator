import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";

export class Bitmex extends BaseExchange {
  constructor() {
    super(ExchangeType.WebSocket, "wss://www.bitmex.com/realtime", true);
  }
  subscribe() {
    /*
    const message = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1,
    };*/
    var ticker = "XBTUSD";
    const message = {
      op: "subscribe",
      //args: ['orderBookL2:XBTUSD']
      args: [`trade:${ticker}`]
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {

    this.subscribe();

  }
  tradehandler(message: any){
      //if(message.action != "insert"){
        //console.log(message);
      //}
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
