import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import Logger from "../Utils/Logger";
import { WebSocketCommands } from "../Enums/WebSocketCommands";
import { WebSocketChannels } from "../Enums/WebSocketChannels";
import { Exchanges } from "../Exchanges";
import {
  WebSocketConnection,
  WebSocketPayload,
  WebSocketSubscription,
  WebSocketMessage,
  TradeEntity,
} from "../Types";
export class WebSocketServer {
  private static wss: WebSocket.Server;
  private trades: {[id: string] : Array<TradeEntity>};
  private logger = new Logger("WebSocket");
  private connections: Record<string, WebSocketConnection> = {};
  constructor() {
    this.trades = {};
    const app = express();
    // initialize a simple http server
    const server = http.createServer(app);

    // initialize the WebSocket server instance
    WebSocketServer.wss = new WebSocket.Server({ server });
    // start our server
    server.listen(process.env.PORT || 4000, this.onServerStart);
    WebSocketServer.wss.on("connection", this.onConnection);
  }
  getKey(req: http.IncomingMessage): string {
    return req.headers["sec-websocket-key"] as string;
  }
  onConnection = (ws: WebSocket, req: http.IncomingMessage) => {
    this.logger.success("New Connection!");
    const ID = this.getKey(req);
    this.connections[ID] = { ws, list: [] };
    ws.on("message", (data: WebSocket.Data) => this.onMessage(ID, data));
    ws.on("close", () => this.onClose(ID));
  };
  onClose(ID: string) {
    this.logger.error("Connection lost!");
    delete this.connections[ID];
  }
  onMessage(ID: string, data: WebSocket.Data) {
    const payload = JSON.parse(data.toString());
    if (Array.isArray(payload)) {
      for (const data of payload) this.commandHandler(ID, data);
    } else {
      this.commandHandler(ID, payload);
    }
  }

  commandHandler(ID: string, payload: WebSocketMessage) {
    switch (payload.command) {
      case WebSocketCommands.SUBSCRIBE:
        this.subscribe(ID, payload);
        break;
      case WebSocketCommands.UNSUBSCRIBE:
        this.unsubscribe(ID, payload);
        break;
      case WebSocketCommands.QUERY:
        this.query(ID, payload);
        break;
      default:
        console.log("invalid", payload.data)
        this.sendToConnection(ID, { error: "Invalid message" });
        break;
    }
  }
  broadcast(
    channel: WebSocketChannels,
    data: any,
    filter: Function,
    source: string
  ) {
    const findFilter = (sub: WebSocketSubscription) =>
      sub.channel === channel && filter(sub.data);

    for (const ID in this.connections) {
      const { list } = this.connections[ID];
      if (list.find(findFilter)) {
        this.send(ID, channel, data, source);
      }
    }
  }

  save_trade(exchange: String, symbol:String, trade: TradeEntity) {
    // console.log(this.trades)
    const key = exchange+":"+symbol;
    if (!(key in this.trades)) {
      this.trades[key] = [];
    }
    const last_trade = this.trades[key].slice(-1);
    if (!(last_trade[0] === undefined)) {
      if (new Date(last_trade[0].timestamp).getUTCDay() != new Date(trade.timestamp).getUTCDay()) {
        this.trades[key] = [];
      }
    }
    this.trades[key].push(trade);
  }
  subscribe(ID: string, payload: WebSocketMessage) {
    const { channel, data } = payload;
    this.connections[ID].list.push({
      channel,
      data,
    });

    if (channel == "TRADES") {
      const key = data.exchange.toUpperCase()+":"+data.pair.toUpperCase();
      if (!(key in this.trades)) {
        this.trades[key] = [];
      }
      this.send(ID, channel, {trades: this.trades[key]}, data.exchange.toUpperCase());
    }
    this.logger.log(`User: ${ID} subscribed to channel: ${channel} ${JSON.stringify(data)}`);
  }
  query(ID: string, payload: WebSocketMessage) {
    const result = Exchanges.searchTickers(
      payload.data.exchange,
      payload.data.ticker
    );
    this.send(ID, WebSocketChannels.TICKERS, result, "QUERY_RESULT");
  }

  unsubscribe(ID: string, payload: WebSocketMessage) {
    const index = this.connections[ID].list.findIndex(
      (sub: WebSocketSubscription) => sub.channel === payload.channel
    );
    if (index == -1) return;
    this.connections[ID].list.splice(index, 1);
  }

  send(ID: string, channel: WebSocketChannels, data: any, source: string) {
    const payload: WebSocketPayload = {
      channel,
      source,
      data,
    };
    this.sendToConnection(ID, payload);
  }
  sendToConnection(ID: string, message: any): void {
    this.connections[ID].ws.send(JSON.stringify(message));
  }
  onServerStart = () => {
    this.logger.success(`WebSocket server started`);
  };
}
