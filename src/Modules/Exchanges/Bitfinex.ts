// :)) lemme do this one nig nog pls


import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";
import e from "express";
import { walkUpBindingElementsAndPatterns } from "typescript";

export class Bitfinex extends BaseExchange {
  private channelToTicker: any = {};
  constructor() {// public api
    super(ExchangeType.WebSocket, "wss://api-pub.bitfinex.com/ws/2", true);
  }
  subscribe() {
    const message = {
      event: "subscribe",
      channel: "trades",
      symbol: 'tBTCUSD'
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {
    this.subscribe();
  }
  onMessage(message: any) {
      //console.log(typeof message, message);
      if (!(message instanceof Array)) {
        console.log(message)
        this.channelToTicker[message.chanId] = [message.symbol, message.pair, message.channel]
        return;
      }
      //console.log(this.channelToTicker[message[0]][2])
      switch (this.channelToTicker[message[0]][2]){
        case "trades": {
          if((message[1].includes("te")|| message[1].includes("tu"))){
            //update
            var trade:TradeEntity = {size:message[2][2], timestamp: message[2][1], price: message[2][3], ticker: this.channelToTicker[message[0]][1]}   
            //this.logger.log(JSON.stringify(trade,null,4),"Trade", trade.timestamp)
            this.addTransaction(trade);
          }
    
          else{
            console.log(message)
            message[1].forEach((element: any) => {
              // new trade
              var trade:TradeEntity = {size:element[2], timestamp: element[1], price: element[3], ticker: this.channelToTicker[message[0]][1]}
              
              this.addTransaction(trade);
              
            });
          }



        }
      }

  }
}
