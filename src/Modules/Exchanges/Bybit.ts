import { BaseExchange } from "./BaseExchange";
import { ExchangeType } from "../Enums/ExchangeType";
import { OrderBookEntity } from "../Types/OrderBookEntity";

export class Bybit extends BaseExchange {
  constructor() {
    super(ExchangeType.WebSocket, "wss://stream.bybit.com/realtime");
  }

  public onConnected() {
    // https://bybit-exchange.github.io/docs/inverse/#t-websocketorderbook200
    this.send(
      JSON.stringify({ op: "subscribe", args: ["orderBook_200.100ms.BTCUSD"] })
    );
  }
  public onMessage(data: any) {
    var topic = data.topic;
    //console.log(topic);
    switch (topic) {
      // PUBLIC TOPICS RELEVANT TO US

      // orderbook ->
      //     200 orders per side
      //     delete and update fields useful
      case "orderBook_200.100ms.BTCUSD": {
        this.OrderbookHandler(data);
        break;
      }

      // Get Live trades, useful for tick charts
      case "trade.BTCUSD": {
        break;
      }

      // idk yet, might be important for tick charts not sure
      case "instrument_info.100ms.BTCUSD": {
        break;
      }
      // live chart data, timeframes: 1, 3, 5, 15, 30,
      //                    60, 120, 240, 360, D, W, M
      case "klineV2.1.BTCUSD": {
        break;
      }

      // PRIVATE TOPICS - do we need em?

      // current positions
      case "position": {
        break;
      }

      case "execution": {
        break;
      }

      // Users' live orders
      case "order": {
        break;
      }

      case "stop": {
        break;
      }

      default: {
        if (!data.success) {
          console.log(topic, data);
          console.log("fuck yo ass nigga, somethin gay came here");
        }
      }
    }
  }
  /*

    29140.0 -> 29150.0  537,391.0
    29150.0 -> 29160.0  321,670.0
    29160.0 -> 29170.0  849,557.0
    29170.0 -> 29180.0  1,487,833.0
    29180.0 -> 29190.0  2,147,172.0
    29190.0 -> 29200.0  3,321,772.0
    29200.0 -> 29210.0  2,373,021.0
    29210.0 -> 29220.0  4,914,421.0
    29220.0 -> 29230.0  6,177,103.0
    29230.0 -> 29240.0  3,363,306.0
    29240.0 -> 29243.5  3,260,962.0
 */
  private OrderbookHandler(data: any): Array<any> {
    const Sell: any[] = [];
    const Buy: any[] = [];

    //{price: Number, size: Number, side: String, id: string}
    //console.log(data);
    //this.orderbook[0].size
    if (data.data.delete) {
      //console.log("NIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\nNIGEr\n");
      data.data.delete.forEach((element: any) => {});
    } else {
      console.log("got orderbook boi\n");
      //console.log(data);
      data.data.forEach((element: any) => {
        const FORMATTED = {
          ...element,
          price: Number(element.price),
        };
        if (element.side == "Buy") Buy.push(FORMATTED);
        else Sell.push(FORMATTED);
      });
      this.aggregateOrderBook({ bids: Sell, asks: Buy }, 10);
      //this.printBook(true);
    }
    return [];
  }

  printBook(buy: boolean) {
    if (buy) {
      this.orderbook.BUY?.forEach((element: any) => {
        console.log(
          "%s %.2f %d",
          "\x1b[32m",
          element["startPrice"],
          element["endPrice"],
          element["size"]
        );
      });
    } else {
      this.orderbook.SELL?.forEach((element: any) => {
        console.log(
          "%s %.2f %d",
          "\x1b[31m",
          element["startPrice"],
          element["endPrice"],
          element["size"]
        );
      });
    }
  }
}
