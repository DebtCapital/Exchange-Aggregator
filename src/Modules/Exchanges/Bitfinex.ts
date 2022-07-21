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
    super(ExchangeType.WebSocket, "wss://api-pub.bitfinex.com/ws/2", true, "", 0, false);
  }
  subscribe(nigs:Array<any>) {
    nigs.forEach(element => {
      const message = {
        event: "subscribe",
        channel: "trades",
        symbol: element
      };

      this.send(JSON.stringify(message));
      
      const message2 = {
        event: "subscribe",
        channel: "book",
        symbol: element,
        prec: "P1",
        freq: "F0",
        len: 1,
      };
      this.send(JSON.stringify(message2));
    }); 
  }
  async onConnected() {
    const { data } = await axios.get(
      "https://api-pub.bitfinex.com/v2/tickers",
      {
        params: {
          symbols: "ALL"
        },
      }
    );
    var ticks = data.filter((element: Array<any>) => element[0].startsWith("t")).filter((a:any) => a[8] * a[1] > 20000000).map((element: Array<any>) => element[0])
    this.tickers = ticks.map((element: any) => element.substr(1))
    // console.log(this.tickers)
    this.subscribe(ticks);
  }
  tradeHandler(message: any){
    if (message[1].includes("te") || message[1].includes("tu")) {
      //update
      var side = "";
      if (message[2][2] > 0) {
        side = "buy";
      } else {
        side = "sell";
      }
      var trade: TradeEntity = {
        size: Math.abs(message[2][2]),
        timestamp: message[2][1],
        price: message[2][3],
        ticker: this.channelToTicker[message[0]][1],
        side:  side
      };
      this.addTransaction(trade);
    } else {
      if(message[1] == 'hb'){
        //console.log("sending", message)
        this.send(message)
        return;
      }
      message[1].forEach((element: any) => {
        // new trade
        var side = "";
        if (element[2] > 0) {
          side = "buy";
        } else {
          side = "sell";
        }
        var trade: TradeEntity = {
          size: Math.abs(element[2]),
          timestamp: element[1],
          price: element[3],
          ticker: this.channelToTicker[message[0]][1],
          side,
        };

        this.addTransaction(trade);
      });
    }
  }
  BookHandler(message:any){
    const precision = 100;
    const ticker = this.channelToTicker[message[0]][1];
    if (message[1][0] instanceof Array) {
      // Snapshot
      if (!this.orderbook[ticker]) {
        this.orderbook[ticker] = { SELL: [], BUY: [] };
      }
      message[1].forEach((element: any) => {
        var book: OrderBookEntity = {
          id: "",
          startPrice: element[0],
          endPrice: element[0] + precision,
          size: element[2] > 0 ? element[2] : element[2] * -1,
        };
        this.orderbook[ticker][element[2] > 0 ? "BUY" : "SELL"].push(book);
      });
    } else {
      // updates
      var idx = this.orderbook[ticker][
        message[1][2] > 0 ? "BUY" : "SELL"
      ].findIndex(
        (orderbookElement: OrderBookEntity) =>
          orderbookElement.startPrice == message[1][0]
      );
      if (message[1][1] > 0) {
        if (idx == -1) {
          // we need to insert a new entry
          var book: OrderBookEntity = {
            id: "",
            startPrice: message[1][0],
            endPrice: message[1][0] + precision,
            size: message[1][2] > 0 ? message[1][2] : message[1][2] * -1,
          };
          this.orderbook[ticker][message[1][2] > 0 ? "BUY" : "SELL"].push(book);
        } else {
          if (idx != -1) {
            this.orderbook[ticker][message[1][2] > 0 ? "BUY" : "SELL"][idx].size =
              message[1][2] > 0 ? message[1][2] : message[1][2] * -1;
          } else {
            console.log("Something went horribly wrong in the Finex orderbook");
          }
        }
      } else {
        this.orderbook[ticker][message[1][2] > 0 ? "BUY" : "SELL"].splice(idx, 1);
      }
      //console.log(message);
    }
    this.updateBook(ticker)
  }
  onMessage(message: any) {
    //console.log(typeof message, message);
    if (!(message instanceof Array)) {
      //console.log(message);
      if (message.chanId == undefined) {
        console.log(message)
        return;
      }
      this.channelToTicker[message.chanId] = [
        message.symbol,
        message.pair,
        message.channel,
      ];
      return;
    }
    // console.log(message[0], this.channelToTicker)
    // console.log(this.channelToTicker, message[0])
    switch (this.channelToTicker[message[0]][2]) {
      case "trades": {
        this.tradeHandler(message);
        break;
      }
      // https://docs.bitfinex.com/reference#ws-public-books
      case "book": {
        this.BookHandler(message);
        break;
      }
    }
  }
}
