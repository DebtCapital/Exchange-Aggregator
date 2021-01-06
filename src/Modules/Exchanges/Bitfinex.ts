// :)) lemme do this one nig nog pls

import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { OrderBookEntity } from "../Types/OrderBookEntity";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";
import e from "express";
import { walkUpBindingElementsAndPatterns } from "typescript";

export class Bitfinex extends BaseExchange {
  private channelToTicker: any = {};
  constructor() {
    // public api
    super(ExchangeType.WebSocket, "wss://api-pub.bitfinex.com/ws/2", true);
  }
  subscribe() {
    /*
    const message = {
      event: "subscribe",
      channel: "trades",
      symbol: 'tBTCUSD'
    };*/

    const message = {
      event: "subscribe",
      channel: "book",
      symbol: "tBTCUSD",
      prec: "P1",
      freq: "F0",
      len: 1,
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {
    this.subscribe();
  }
  onMessage(message: any) {
    //console.log(typeof message, message);
    if (!(message instanceof Array)) {
      console.log(message);
      this.channelToTicker[message.chanId] = [
        message.symbol,
        message.pair,
        message.channel,
      ];
      return;
    }
    //console.log(this.channelToTicker[message[0]][2])
    switch (this.channelToTicker[message[0]][2]) {
      case "trades": {
        if (message[1].includes("te") || message[1].includes("tu")) {
          //update
          //console.log("data: ",message)
          var trade: TradeEntity = {
            size: message[2][2],
            timestamp: message[2][1],
            price: message[2][3],
            ticker: this.channelToTicker[message[0]][1],
          };
          //this.logger.log(JSON.stringify(trade,null,4),"Trade", trade.timestamp)
          this.addTransaction(trade);
        } else {
          console.log(message);
          message[1].forEach((element: any) => {
            // new trade
            var trade: TradeEntity = {
              size: element[2],
              timestamp: element[1],
              price: element[3],
              ticker: this.channelToTicker[message[0]][1],
            };

            this.addTransaction(trade);
          });
        }
      }
      // https://docs.bitfinex.com/reference#ws-public-books
      case "book": {
        const precision = 10;
        if (message[1][0] instanceof Array) {
          //console.log(message)
          // Snapshot

          message[1].forEach((element: any) => {
            var book: OrderBookEntity = {
              id: "",
              startPrice: element[0],
              endPrice: element[0] + precision,
              size: element[2] > 0 ? element[2] : element[2] * -1,
            };
            this.orderbook[element[2] > 0 ? "BUY" : "SELL"].push(book);
          });
          //this.printBook();
        } else {
          // updates
          var idx = this.orderbook[
            message[1][2] > 0 ? "BUY" : "SELL"
          ].findIndex(
            (orderbookElement: OrderBookEntity) =>
              orderbookElement.startPrice == message[1][0]
          );
          if (message[1][1] > 0) {
            if (idx == -1) {
              //console.log(`DUMB NIGGER ALERT DUMB NIGGER ALERT ${message}`);
              // we need to insert a new entry
              var book: OrderBookEntity = {
                id: "",
                startPrice: message[1][0],
                endPrice: message[1][0] + precision,
                size: message[1][2] > 0 ? message[1][2] : message[1][2] * -1,
              };
              this.orderbook[message[1][2] > 0 ? "BUY" : "SELL"].push(book);
            } else {
              if (idx != -1) {
                this.orderbook[message[1][2] > 0 ? "BUY" : "SELL"][idx].size =
                  message[1][2] > 0 ? message[1][2] : message[1][2] * -1;
              } else {
                console.log("NIGGER");
              }
            }
          } else {
            this.orderbook[message[1][2] > 0 ? "BUY" : "SELL"].splice(idx, 1);
          }
          //console.log(message);
        }
        this.printBook();
      }
    }
  }
}
