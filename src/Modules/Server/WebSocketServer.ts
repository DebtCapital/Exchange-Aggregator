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
} from "../Types";
export class WebSocketServer {
  private static wss: WebSocket.Server;
  private logger = new Logger("WebSocket");
  private connections: Record<string, WebSocketConnection> = {};
  constructor() {
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
  subscribe(ID: string, payload: WebSocketMessage) {
    const { channel, data } = payload;
    this.connections[ID].list.push({
      channel,
      data,
    });
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
