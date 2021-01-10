import { WebSocketChannels } from "../Enums/WebSocketChannels";
import { WebSocketCommands } from "../Enums/WebSocketCommands";

export type WebSocketMessage = {
  command: WebSocketCommands;
  channel: WebSocketChannels;
  data: any;
};
