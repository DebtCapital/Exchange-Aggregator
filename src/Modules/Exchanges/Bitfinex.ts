// :)) lemme do this one nig nog pls


import { ExchangeType } from "../Enums/ExchangeType";
import { TradeType } from "../Enums/TradeType";
import { TradeEntity } from "../Types/TradeEntity";
import { BaseExchange } from "./BaseExchange";
import axios from "axios";

export class Bitfinex extends BaseExchange {
  constructor() {// public api
    super(ExchangeType.WebSocket, "wss://api-pub.bitfinex.com/ws/2", true);
  }
  subscribe(streams: Array<string>) {
    const message = {
      method: "SUBSCRIBE",
      params: streams,
      id: 1,
    };
    this.send(JSON.stringify(message));
  }
  async onConnected() {

  }
  onMessage(message: any) {
      console.log(message);
  }
}
