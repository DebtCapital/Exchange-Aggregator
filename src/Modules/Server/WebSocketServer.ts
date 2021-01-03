import express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import Timer = NodeJS.Timer;
import Logger from "../Utils/Logger";

let timer: Timer;

export class WebSocketServer {
  private wss;
  private logger = new Logger("WebSocket");
  private subscribtions: Record<string, Array<string>> = {};
  constructor() {
    const app = express();
    // initialize a simple http server
    const server = http.createServer(app);

    // initialize the WebSocket server instance
    this.wss = new WebSocket.Server({ server });
    // start our server
    server.listen(process.env.PORT || 3000, this.onServerStart);
    this.wss.on("connection", this.onConnection);
  }
  onConnection = (ws: WebSocket, req: http.IncomingMessage) => {
    this.logger.success("New Connection!");
    const ID = req.headers["sec-websocket-key"] as string;
    if (!ID) this.logger.error("NO WEBSOCKET KEY HEADER");
    this.subscribtions[ID] = [];
    ws.on(
      "message",
      this.onMessage.bind({ ID, logger: this.logger, this: this })
    );
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
  onMessage(data: WebSocket.Data) {
    const self = this as any;
    const ID = self.ID;

    try {
      const payload = JSON.parse(data.toString());
      this.logger.log(
        `Received a message from: ${ID} containing: ${JSON.stringify(
          payload,
          null,
          4
        )}`
      );
      if (["SUBSCRIBE", "UNSUBSCRIBE"].includes(payload.COMMAND)) {
        if (payload.COMMAND === "SUBSCRIBE") {
          self.this.subscribtions[ID].push(payload.data);
          self.logger.success(`User ${ID} subscribed to: ${payload.data}`);
        } else {
        }
      }
    } catch (e) {
      this.logger.error(
        `Received a message from: ${ID} containing: ${data} instead of JSON!`
      );
    }
  }
  onConnect = () => {};

  send() {
    this.wss.emit("AAAAAAAa");
  }
  onServerStart = () => {
    this.logger.success(`WebSocket server started`);
  };
}
