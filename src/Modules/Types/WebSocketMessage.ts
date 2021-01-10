import { WebSocketChannels } from "../Enums/WebSocketChannels";
import { WebSocketCommands } from "../Enums/WebSocketCommands";

export type WebSocketMessage = {
  command: "SUBSCRIBE" | "UNSUBSCRIBE" | "QUERY";
  channel: WebSocketChannels;
  data: any;
};
