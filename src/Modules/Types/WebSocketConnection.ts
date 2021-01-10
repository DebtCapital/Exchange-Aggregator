import * as WebSocket from "ws";
import { WebSocketSubscription } from "./";

export type WebSocketConnection = {
  ws: WebSocket;
  list: Array<WebSocketSubscription>;
};
