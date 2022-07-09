import { BaseExchange } from "./BaseExchange";
import { ExchangeType } from "../Enums/ExchangeType";
import { OrderBookEntity } from "../Types/OrderBookEntity";
import { OrderBookSide } from "../Types/OrderBookSide";
import { OHLCVEntity } from "../Types/OHLCVEntity";
import { TradeEntity } from "../Types/TradeEntity";
import axios from "axios";

export class BybitUSDT extends BaseExchange {
  private nig = 0;
  private last_vol = 0;
  private last_open = 0;
  private last_dat = {};
  private futs: any = {};
  constructor() {
    super(ExchangeType.WebSocket, "wss://stream.bybit.com/realtime_public", true, '{"op":"ping"}', 3000, true);
  }
  /*
  export type TradeEntity = {
    ticker: string;
    size: number;
    price: number;
  };
  
  */

  private instrumentInfoHandler(data: any, ticker: string) {
    // oi, funding, predicted funding, funding time, countdown to funding
    // first message
    if (data.data.funding_rate_e6) {
      this.futs = {
        funding: data.data.funding_rate_e6,
        predicted_funding: data.data.predicted_funding_rate_e6,
        next_funding_time: data.data.next_funding_time,
        open_interest: data.data.open_interest,
        countdown_hour: data.data.countdown_hour,
      };
      //console.log(this.futs)
    }
    //updates
    else {
      //console.log(data.data)
      data.data.update.forEach((element: any) => {
        const before = Object.values(this.futs).join("");
        if (element.funding_rate_e6)
          this.futs.funding = element.funding_rate_e6;
        if (element.countdown_hour)
          this.futs.countdown_hour = element.countdown_hour;
        if (element.predicted_funding_rate_e6)
          this.futs.predicted_funding = element.predicted_funding_rate_e6;
        if (element.next_funding_time)
          this.futs.next_funding_time = element.next_funding_time;
        if (element.open_interest)
          this.futs.open_interest = element.open_interest;
        const after = Object.values(this.futs).join("");
        if (after != before) {
          this.logger.log(this.futs, "FUTS");
        }
      });
      //console.log(this.futs)
    }
  }

  private tradeHandler(data: any, ticker: string) {
    //console.clear()
    //console.log(data)
    data.data.forEach((element: any) => {
      var side = element.tick_direction.replace("Zero", "");

      var trade: TradeEntity = {
        size: element.size,
        timestamp: element.trade_time_ms,
        ticker,
        price: element.price,
        side: element.side
      };
      //this.logger.log(JSON.stringify(trade,null,4),"Trade", trade.timestamp)
      this.addTransaction(trade);
    });
  }

  private tickManager(data: any, vol: number) {
    var tik: OHLCVEntity = {
      Open: data.open,
      High: data.high,
      Low: data.low,
      Close: data.close,
      Volume: vol,
      Timestamp: data.timestamp,
    };
    // do whatever you like with the ticks
    //console.log("tick: ", tik)
  }
  private ohlcvManager(data: any) {
    //console.log(data)
    var tik: OHLCVEntity = {
      Open: data.open,
      High: data.high,
      Low: data.low,
      Close: data.close,
      Volume: data.volume,
      Timestamp: data.start,
    };

    // do whatever you like with the ticks
  }

  private KlineV2Handler(data: any, ticker: string) {
    data.data.forEach((element: any) => {
      if (this.tick) {
        //console.log("price changed by: ",element.close - this.nig)

        // all of this is needed to get volume PER TICK
        var volume = 0;
        if (this.last_open != element.open) {
          this.last_vol = element.volume;
          volume = this.last_vol;
        } else {
          volume = element.volume - this.last_vol;
          this.last_vol = element.volume;
        }
        this.last_open = element.open;
        this.tickManager(element, volume);
      } else {
        if (this.last_open != element.open) {
          this.ohlcvManager(data.data);
        }
        this.last_open = element.open;
      }

      this.nig = element.close;
      this.last_dat = data.data;
    });
  }

  async onConnected() {
    const { data } = await axios.get("https://api.bybit.com/v2/public/tickers");

    data.result.forEach((element: any) => {
      // console.log(element.volume_24h, parseFloat(element.last_price))
      if (element.volume_24h * parseFloat(element.last_price) > 20000000)
      {
        if(element.symbol.endsWith("USDT")){
          this.tickers.push(element.symbol);
          this.send(
              JSON.stringify({ op: "subscribe", args: [`trade.${element.symbol}`] })
              //JSON.stringify({ op: "subscribe", args: [`orderBook_200.100ms.${ticker}`] })
              //JSON.stringify({ op: "subscribe", args: [`klineV2.${interval}.${ticker}`] })

              // subs only to inverse atm
              //'{"op": "subscribe", "args": ["trade.BTCUSDT"]}'
              // JSON.stringify({ op: "subscribe", args: [`instrument_info.100ms.${ticker}`] })
                      
              )
        }
      }
    });
    console.log(this.tickers)
  }

  // LIMIT IS 200, SO MAKE SURE TO ONLY QUERY 200 BRUV
  public async historicalKline(from: Number, ticker: any, interval: any) {
    console.log(from);
    //https://bybit-exchange.github.io/docs/inverse/#t-querykline
    const { data } = await axios.get(
      "https://api.bybit.com/v2/public/kline/list",
      {
        params: {
          symbol: ticker,
          interval: interval,
          from,
        },
      }
    );

    data.result.forEach((element: any) => {
      console.log(
        element.open,
        element.high,
        element.low,
        element.close,
        element.volume
      );
    });
    //console.log( data.result)
  }
  public onMessage(data: any) {
    var topic = data.topic;
    var ticker = "";
    if (topic) {
      var tmp = /[^.]*$/.exec(topic);
      if (tmp != null) {
        ticker = tmp[0];
      }

      topic = topic.replace(ticker, "");
    }

    //console.log(topic);
    switch (topic) {
      // PUBLIC TOPICS RELEVANT TO US

      // orderbook ->
      //     200 orders per side
      //     delete and update fields useful
      case "orderBook_200.100ms.": {
        this.OrderbookHandler(data, ticker);
        break;
      }

      // Get Live trades, useful for tick charts
      case "trade.": {
        this.tradeHandler(data, ticker);
        break;
      }

      // idk yet, might be important for tick charts not sure
      case "instrument_info.100ms.": {
        this.instrumentInfoHandler(data, ticker);
        break;
      }
      // live chart data, timeframes: 1, 3, 5, 15, 30,
      //                    60, 120, 240, 360, D, W, M
      case "klineV2.1.": {
        this.KlineV2Handler(data, ticker);
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
          console.log("failed sth");
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
  private OrderbookHandler(data: any, ticker: string): Array<any> {
    const Sell: any[] = [];
    const Buy: any[] = [];

    if (!this.orderbook[ticker]) {
      this.orderbook[ticker] = { SELL: [], BUY: [] };
    }

    if (data.data.delete) {
      data.data.delete.forEach((delete_element: any) => {
        var idx = this.orderbook[ticker][
          delete_element.side == "Buy" ? "BUY" : "SELL"
        ].findIndex(
          (orderbookElement: OrderBookEntity) =>
            orderbookElement.startPrice == delete_element.price ||
            orderbookElement.id == delete_element.id
        );

        if (idx == -1) {
          console.log(`Something went really wrong in BybitUSDT orderbook ${Math.random()}`);
        } else {
          //console.log(idx, this.orderbook[delete_element.side ? "BUY" : "SELL"].length, delete_element.side)
          this.orderbook[ticker][delete_element.side == "Buy" ? "BUY" : "SELL"][
            idx
          ].id = delete_element.id;
          this.orderbook[ticker][
            delete_element.side == "Buy" ? "BUY" : "SELL"
          ].splice(idx, 1);
        }
      });
      data.data.insert.forEach((insert_element: any) => {
        //console.log("INSERT")
        var idx = this.orderbook[ticker][
          insert_element.side == "Buy" ? "BUY" : "SELL"
        ].findIndex(
          (orderbookElement: OrderBookEntity) =>
            orderbookElement.startPrice == insert_element.price ||
            orderbookElement.id == insert_element.id
        );
        if (idx == -1) {
          //console.log(delete_element)
          //console.log(this.orderbook)
          //console.log(`DUMB INSERT ALERT DUMB INSERT ALERT ${Math.random()}`)
          this.orderbook[ticker][
            insert_element.side == "Buy" ? "BUY" : "SELL"
          ].push({
            startPrice: insert_element.price,
            endPrice: 0,
            size: insert_element.size,
            id: insert_element.id,
          });
        } else {
          this.orderbook[ticker][insert_element.side == "Buy" ? "BUY" : "SELL"][
            idx
          ].id = insert_element.id;
          this.orderbook[ticker][insert_element.side == "Buy" ? "BUY" : "SELL"][
            idx
          ].size = Number(insert_element.price);
        }
      });
      data.data.update.forEach((update_element: any) => {
        var idx = this.orderbook[ticker][
          update_element.side == "Buy" ? "BUY" : "SELL"
        ].findIndex(
          (orderbookElement: OrderBookEntity) =>
            orderbookElement.startPrice == update_element.price ||
            orderbookElement.id == update_element.id
        );
        if (idx == -1) {
          console.log(`DUMB UPDATE ALERT DUMB UPDATE ALERT ${Math.random()}`);
        } else {
          this.orderbook[ticker][update_element.side == "Buy" ? "BUY" : "SELL"][
            idx
          ].id = update_element.id;
          this.orderbook[ticker][update_element.side == "Buy" ? "BUY" : "SELL"][
            idx
          ].size = Number(update_element.price);
        }
      });
    } else {
      data.data.forEach((element: any) => {
        const FORMATTED = {
          id: element.id,
          startPrice: Number(element.price),
          endPrice: 0,
          size: element.size,
        };
        if (element.side == "Buy") {
          this.orderbook[ticker].BUY.push(FORMATTED);
        } else {
          this.orderbook[ticker].SELL.push(FORMATTED);
        }
      });
      //this.aggregateOrderBook({ bids: Sell, asks: Buy }, 10);
    }
    this.printBook(ticker);
    return [];
  }
}
