import { OHLCVEntity } from "../Types/OHLCVEntity";
import { TradeEntity } from "../Types/TradeEntity";
import moment from "moment";
import { Server as WebSocketServer } from "../Server";
import { WebSocketChannels } from "../Enums/WebSocketChannels";
export class OHLCV {
  private _trades: Array<TradeEntity> = [];
  private _latest: Record<string, Record<string, OHLCVEntity>> = {};
  private timeframes: Array<number> = [1, 3, 30, 60];
  private _candles: Record<string, Record<string, Array<OHLCVEntity>>> = {};

  constructor(private exchangeName: string) {}

  private round(date: Date, duration: any) {
    return moment(Math.floor(+date / +duration) * +duration)
      .toDate()
      .getTime();
  }

  public addTrade(trade: TradeEntity) {
    this._trades.push(trade);
    this.buildLatestCandles(trade.ticker);
  }

  private ensureRecords(ticker: string, tf: number) {
    if (!this._candles[ticker]) {
      this._candles[ticker] = {};
    }
    if (!this._latest[ticker]) {
      this._latest[ticker] = {};
    }
    if (!this._candles[ticker][tf]) {
      this._candles[ticker][tf] = [];
    }
  }
  private saveCandle(ohlcv: OHLCVEntity, ticker: string, timeframe: number) {
    const latest = this._latest[ticker][timeframe];

    if (latest && latest.Timestamp != ohlcv.Timestamp) {
      this._candles[ticker][timeframe].push(ohlcv);
    }

    this._latest[ticker][timeframe] = ohlcv;

    WebSocketServer.broadcast(
      WebSocketChannels.OHLCV,
      ohlcv,
      (sub: any) => {
        return (
          sub.ticker === ticker &&
          sub.exchange === this.exchangeName.toUpperCase() &&
          timeframe === sub.timeframe
        );
      },
      `${this.exchangeName}:${ticker}`
    );
  }

  private buildLatestCandles(ticker: string) {
    for (const tf of this.timeframes) {
      this.ensureRecords(ticker, tf);

      const lastCandle = this.round(this.roundToSecond(), tf * 1000);

      const tradeIndex = this._trades.findIndex(({ timestamp }) => {
        return lastCandle <= timestamp;
      });

      if (tradeIndex == -1) continue;

      const trades = this._trades.slice(tradeIndex, this._trades.length - 1);

      const prices = trades
        .filter((trade) => trade.ticker === ticker)
        .map(({ price }) => price);
      if (prices.length === 0) continue;

      const ohlcv: OHLCVEntity = {
        Open: Number(prices[0]),
        High: Math.max(...prices),
        Low: Math.min(...prices),
        Close: Number(prices[prices.length - 1]),
        Volume: 0,
        Timestamp: lastCandle,
      };
      this.saveCandle(ohlcv, ticker, tf);
    }
  }

  private roundToSecond(timestamp: number = new Date().getTime()): Date {
    return moment(timestamp).startOf("second").toDate();
  }
}
