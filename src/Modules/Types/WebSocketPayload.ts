import { WebSocketChannels } from "../Enums/WebSocketChannels";

export type WebSocketPayload = {
  channel: WebSocketChannels;
  data: any;
  source?: string;
};
