import { BaseExchange } from "./BaseExchange";
import { ExchangeType } from "../Enums/ExchangeType";
import { OrderBookEntity } from "../Types/OrderBookEntity";
import { OrderBookSide } from "../Types/OrderBookSide";
import {OHLCVEntity} from "../Types/OHLCVEntity"
import {TradeEntity} from "../Types/TradeEntity"
export class Bybit extends BaseExchange {
  private nig =0;
  private last_vol= 0;
  private last_open = 0;
  private last_dat = {};
  private futs:any = {};
  constructor() {
    super(ExchangeType.WebSocket, "wss://stream.bybit.com/realtime", true);
  }
  /*
  export type TradeEntity = {
    ticker: string;
    size: number;
    price: number;
  };
  
  */

  private instrumentInfoHandler(data: any, ticker: string){
    // oi, funding, predicted funding, funding time, countdown to funding
    // first message
    if(data.data.funding_rate_e6){
      this.futs = {"funding": data.data.funding_rate_e6, "predicted_funding": data.data.predicted_funding_rate_e6, "next_funding_time": data.data.next_funding_time, "open_interest": data.data.open_interest, "countdown_hour": data.data.countdown_hour}
      //console.log(this.futs)
    }
    //updates
    else{
      //console.log(data.data)
      data.data.update.forEach((element: any) => {
        const before  = Object.values(this.futs).join("")
        if(element.funding_rate_e6) this.futs.funding = element.funding_rate_e6;
        if(element.countdown_hour) this.futs.countdown_hour = element.countdown_hour;
        if(element.predicted_funding_rate_e6) this.futs.predicted_funding = element.predicted_funding_rate_e6;
        if(element.next_funding_time) this.futs.next_funding_time = element.next_funding_time;
        if(element.open_interest) this.futs.open_interest = element.open_interest;
        const after  = Object.values(this.futs).join("")
        if(after != before ){
          // NIGGA IT CHANGED AAAAAAAAAAAAAAAAAAA
          this.logger.log(this.futs, "FUTS")
        }
      });
      //console.log(this.futs)
    }
  }


  private tradeHandler(data: any, ticker: string){
    //console.clear()
    //console.log(data)
    data.data.forEach((element:any) => {
      var side = element.tick_direction.replace("Zero", "")

      var trade:TradeEntity = {size: element.size, timestamp: element.trade_time_ms, ticker,price: element.price }
      this.logger.log(JSON.stringify(trade,null,4),"Trade", trade.timestamp)
    });


  }

  private tickManager(data:any, vol: number){
    
    var nig: OHLCVEntity = {Open: data.open, High: data.high, Low: data.low, Close: data.close, Volume: vol, Timestamp:data.timestamp}
    // do whatever you like with the ticks
    //console.log("tick: ", nig)
  }
  private ohlcvManager(data:any){
    //console.log(data)
    var nig: OHLCVEntity = {Open: data.open, High: data.high, Low: data.low, Close: data.close, Volume: data.volume, Timestamp:data.start}

     // do whatever you like with the ticks
  }

  private KlineV2Handler(data:any, ticker: string) {
    data.data.forEach((element: any) => {

      
      if(this.tick){
        //console.log("price changed by: ",element.close - this.nig)

        // all of this is needed to get volume PER TICK
        var volume = 0
        if(this.last_open != element.open){
          this.last_vol = element.volume
          volume = this.last_vol
        }
        else{
          volume = element.volume-this.last_vol
          this.last_vol = element.volume
        }
        this.last_open = element.open
        this.tickManager(element, volume)
      }else{

        if(this.last_open != element.open){
          this.ohlcvManager(data.data)
        }
        this.last_open = element.open
      }
      
      this.nig = element.close;
      this.last_dat = data.data
    });
  }

  public onConnected() {
    // https://bybit-exchange.github.io/docs/inverse/#t-websocketorderbook200
    const  interval = 1
    const ticker = 'BTCUSD'
    this.send(
      
      //JSON.stringify({ op: "subscribe", args: [`orderBook_200.100ms.${ticker}`] })
      //JSON.stringify({ op: "subscribe", args: [`klineV2.${interval}.${ticker}`] })
      JSON.stringify({ op: "subscribe", args: [`trade.${ticker}`] })
      // JSON.stringify({ op: "subscribe", args: [`instrument_info.100ms.${ticker}`] })
    );
  }
  public onMessage(data: any) {   


    var topic = data.topic;
    var ticker = "";
    if(topic){
      
      var tmp = /[^.]*$/.exec(topic) 
      if(tmp!= null){
        ticker = tmp[0];
      }

      topic = topic.replace(ticker, "")
      console.log("topic: ", topic)
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
  private OrderbookHandler(data: any, ticker: string): Array<any> {
    const Sell: any[] = [];
    const Buy: any[] = [];

    if (data.data.delete) {
      data.data.delete.forEach((delete_element: any) => {

        var idx = this.orderbook[delete_element.side == "Buy" ? "BUY" : "SELL"].findIndex(
          (orderbookElement: OrderBookEntity) =>  orderbookElement.startPrice==delete_element.price|| orderbookElement.id==delete_element.id);


        if (idx == -1){
          console.log(`DUMB NIGGER ALERT DUMB NIGGER ALERT ${Math.random()}`)
        }
        else{
          console.log(idx, this.orderbook[delete_element.side ? "BUY" : "SELL"].length, delete_element.side)
          this.orderbook[delete_element.side == "Buy" ? "BUY" : "SELL"][idx].id = delete_element.id
          this.orderbook[delete_element.side == "Buy" ? "BUY" : "SELL"][idx].size = 0
          //this.printBook(true);
        }
      });
      data.data.insert.forEach((insert_element: any) => {
        //console.log("INSERT")
        var idx = this.orderbook[insert_element.side == "Buy" ? "BUY" : "SELL"].findIndex(
          (orderbookElement: OrderBookEntity) =>  orderbookElement.startPrice==insert_element.price|| orderbookElement.id==insert_element.id);
        if (idx == -1){
          
          //console.log(delete_element)
          //console.log(this.orderbook)
          //console.log(`DUMB INSERT ALERT DUMB INSERT ALERT ${Math.random()}`)
          this.orderbook[insert_element.side == "Buy" ? "BUY" : "SELL"].push({startPrice: insert_element.price, endPrice: 0,  size: insert_element.size, id: insert_element.id})
          //this.printBook(true);
        }
        else{
          this.orderbook[insert_element.side == "Buy" ? "BUY" : "SELL"][idx].id = insert_element.id
          this.orderbook[insert_element.side == "Buy" ? "BUY" : "SELL"][idx].size = Number(insert_element.price)
          //this.printBook(true);
        }

      });
      data.data.update.forEach((update_element: any) => {
        var idx = this.orderbook[update_element.side == "Buy" ? "BUY" : "SELL"].findIndex(
          (orderbookElement: OrderBookEntity) =>  orderbookElement.startPrice==update_element.price|| orderbookElement.id==update_element.id);
        if (idx == -1){
          
          console.log(`DUMB UPDATE ALERT DUMB UPDATE ALERT ${Math.random()}`)
        }
        else{
          this.orderbook[update_element.side == "Buy" ? "BUY" : "SELL"][idx].id = update_element.id
          this.orderbook[update_element.side == "Buy" ? "BUY" : "SELL"][idx].size = Number(update_element.price)
          //this.printBook(true);

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
          this.orderbook.BUY.push(FORMATTED);
        } else {
          this.orderbook.SELL.push(FORMATTED);
        }
      });
      //this.aggregateOrderBook({ bids: Sell, asks: Buy }, 10);
    }
    //this.printBook(true);
    return [];
  }

  printBook(buy: boolean) {
    console.clear();

    var nigs = []
    const books = this.aggregateOrderBook({asks: this.orderbook.BUY, bids: this.orderbook.SELL}, 10);
    for(let i = 0; i < Math.max(books.buy.length, books.sell.length); i++){
      const str1 = i < books.buy.length? `${books.buy[i].startPrice} ${books.buy[i].endPrice} ${books.buy[i].size}`: "          ";
      const str2 = i < books.sell.length? `${books.sell[i].startPrice} ${books.sell[i].endPrice} ${books.sell[i].size}` : "";
      console.log("\x1b[32m"+str1, "\x1b[31m"+str2, '\x1b[0m');
    }

  }
}
