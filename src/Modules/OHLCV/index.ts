import { OHLCVEntity } from "../Types/OHLCVEntity";
import { TradeEntity } from "../Types/TradeEntity";
import { Server as WebSocketServer } from "../Server";
import { WebSocketChannels } from "../Enums/WebSocketChannels";
// import //Logger from "../Utils///////////////Logger";
export class OHLCV {
  private _trades: Array<TradeEntity> = [];
  private _latest: Record<string, Record<string, OHLCVEntity>> = {};
  private timeframes: Array<number> = [1, 3, 5, 15, 30, 60];
  private _candles: Record<string, Record<string, Array<OHLCVEntity>>> = {};
  private toUpdate: Array<string> = [];
  constructor(private exchangeName: string) {
    setInterval(() => {
      if (this.toUpdate.length !== 0) {
        const start = new Date().getTime();
        const pairs = Object.values(this.toUpdate)
        const pairCount = pairs.length;
        //////////////Logger.log(`Starting new loop for ${exchangeName}, updating the following ${pairCount} pairs: ${pairs} `);
        for (const ticker of this.toUpdate) {
          // //////////////Logger.log(`Building candle for ${ticker}`);
          this.buildLatestCandles(ticker);
          const index = this.toUpdate.indexOf(ticker);
          this.toUpdate.splice(index, 1);
        }
        const finished = new Date().getTime();

        // //////////////Logger.log(
        //   `Finished all ${pairs} (${pairCount} pairs) for ${exchangeName} and it took: ${
        //     finished - start
        //   } ms`
        // );
      }
    }, 100);
  }

  private round(date: Date, duration: any) {
    return new Date(Math.floor(+date / +duration) * +duration).getTime();
  }

  public addTrade(trade: TradeEntity) {
    this._trades.push(trade);
    if (!this.toUpdate.includes(trade.ticker)) {
      this.toUpdate.push(trade.ticker);
    }
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
  private getTrades(
    ticker: string,
    from: number,
    to: number
  ): Array<TradeEntity> {
    return this._trades
      .reverse()
      .filter(
        (trade: TradeEntity) =>
          trade.ticker === ticker &&
          trade.timestamp > from &&
          trade.timestamp < to
      )
      .reverse();
  }
  private buildLatestCandles(ticker: string) {
    const now = Math.ceil(new Date().getTime() / 1000) * 1000;
    for (const tf of this.timeframes) {
      this.ensureRecords(ticker, tf);

      const lastCandle = this.round(this.roundToSecond(), tf * 1000);

      const trades = this.getTrades(ticker, lastCandle, now);

      if (trades.length === 0) continue;

      const prices = trades.map(({ price }) => price);
      // ////////////Logger.log(
      //   `Found: ${trades.length} trades for ${ticker} on ${this.exchangeName}`
      // );

      const ohlcv: OHLCVEntity = {
        Open: Number(prices[0]),
        High: Math.max(...prices),
        Low: Math.min(...prices),
        Close: Number(prices[prices.length - 1]),
        Volume: 0,
        Timestamp: lastCandle,
      };
      this.saveCandle(ohlcv, ticker, tf);
      ////////////Logger.log(`Finished building candle for pair: ${ticker} on ${this.exchangeName} for timeframe: ${tf}`);
    }
  }

  private roundToSecond(timestamp: number = new Date().getTime()): Date {
    const rounded = new Date(timestamp).getTime();
    return new Date(rounded);
  }
}
