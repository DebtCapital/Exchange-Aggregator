import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import Logger from "../Utils/Logger";
import { WebSocketMessage } from "../Types/WebSocketMessage";
import { WebSocketCommands } from "../Enums/WebSocketCommands";
import { WebSocketChannels } from "../Enums/WebSocketChannels";
import { Exchanges } from "../Exchanges";


export class WebSocketServer {
  private static wss: WebSocket.Server;
  private logger = new Logger("WebSocket");
  private subscribtions: Record<string, any> = {};
  constructor() {
    const app = express();
    // initialize a simple http server
    const server = http.createServer(app);

    // initialize the WebSocket server instance
    WebSocketServer.wss = new WebSocket.Server({ server });
    // start our server
    server.listen(process.env.PORT || 3000, this.onServerStart);
    WebSocketServer.wss.on("connection", this.onConnection);
  }
  onConnection = (ws: WebSocket, req: http.IncomingMessage) => {
    this.logger.success("New Connection!");
    const ID = req.headers["sec-websocket-key"] as string;
    if (!ID) this.logger.error("NO WEBSOCKET KEY HEADER");
    this.subscribtions[ID] = { connection: ws, list: [] };
    ws.on("message", (data: WebSocket.Data) => this.onMessage(ID, data));
    ws.on("open", this.onOpen);
    ws.on("close", this.onClose);
  };
  onOpen = (connection: WebSocket) => {
    this.logger.success("Open Connection!");
  };
  onClose = (connection: WebSocket, code: number, reason: string) => {
    this.logger.error("Connection lost!");
    this.logger.log(code.toString());
  };
  onMessage(ID: string, data: WebSocket.Data) {
    const payload = JSON.parse(data.toString()) as WebSocketMessage;
    this.commandHandler(ID, payload);
  }
  commandHandler(sender: string, payload: WebSocketMessage) {
    if (!Object.values(WebSocketCommands).includes(payload.command)) return;
    if (!Object.values(WebSocketChannels).includes(payload.channel)) return;

    switch (payload.command) {
      case "SUBSCRIBE":
        this.subscribe(sender, payload);
        break;
      case "UNSUBSCRIBE":
        this.unsubscribe(sender, payload);
        break;
      case "QUERY":
        this.query(sender, payload);
        break;
      default:
        break;
    }
  }
  broadcast(
    channel: WebSocketChannels,
    params: any,
    filter: Function,
    source: string | null
  ) {
    for (let i = 0; i < Object.keys(this.subscribtions).length; i++) {
      const key = Object.keys(this.subscribtions)[i];
      if (
        this.subscribtions[key].list.find(
          (sub: any) => sub.channel === channel && filter(sub.data)
        )
      ) {
        this.send(key, channel, params, source);
      }
    }
  }
  subscribe(ID: string, payload: WebSocketMessage) {
    this.subscribtions[ID].list.push({
      channel: payload.channel,
      data: payload.data,
    });
    this.logger.log(`User: ${ID} subscribed to channel: ${payload.channel}`);
  }
  query(ID: string, payload: WebSocketMessage) {
    const result = Exchanges.searchTickers(
      payload.data.exchange,
      payload.data.ticker
    );
    this.send(ID, WebSocketChannels.TICKERS, result);
  }

  unsubscribe(ID: string, payload: WebSocketMessage) {}
  onConnect = () => {};

  send(ID: string, channel: string, data: any, source: string | null = null) {
    const payload = {
      channel,
      source,
      data,
    };
    this.subscribtions[ID].connection.send(JSON.stringify(payload));
  }
  onServerStart = () => {
    this.logger.success(`WebSocket server started`);
  };
}
