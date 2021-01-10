import { WebSocketChannels } from "../Enums/WebSocketChannels";

export type WebSocketSubscription = {
  channel: WebSocketChannels;
  data: any;
};
