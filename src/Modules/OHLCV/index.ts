import { OHLCVEntity } from "../Types/OHLCVEntity";
import { TradeEntity } from "../Types/TradeEntity";
import moment, { duration } from "moment";

export class OHLCV {
  private trades: Array<TradeEntity> = [];

  private timeframes: Array<number> = [2, 4, 6];

  private round(date: Date, duration: any) {
    return moment(Math.floor(+date / +duration) * +duration);
  }
  public addTrade(trade: TradeEntity) {
    console.log();
    for (const timeframe of this.timeframes) {
      var roundedDate = this.round(
        new Date(trade.timestamp),
        moment.duration(timeframe, "second")
      );
      this.trades.push(trade);
    }
  }

  private roundToSecond(timestamp: number): string {
    return moment(timestamp).startOf("second").toDate().toISOString();
  }
  candlesFromTrades(
    seconds: number,
    ticker: string,
    trades: Array<TradeEntity>
  ) {
    const mappedTrades: Record<string, Array<TradeEntity>> = trades
      .filter((trade) => trade.ticker === ticker)
      .reduce((r, a) => {
        r[this.roundToSecond(a.timestamp)] = [
          ...(r[this.roundToSecond(a.timestamp)] || []),
          a,
        ];
        return r;
      }, {} as any);

    const ohlcvArray: Array<OHLCVEntity> = [];

    for (const log in mappedTrades) {
      const logTrades = mappedTrades[log];

      const prices = logTrades.map((logTrade) => logTrade.price);
      const ohlcv: OHLCVEntity = {
        Open: logTrades[0].price,
        High: Math.max(...prices),
        Low: Math.min(...prices),
        Close: logTrades[logTrades.length - 1].price,
        Volume: 0,
        Timestamp: new Date(log).getTime(),
      };
      ohlcvArray.push(ohlcv);
    }
    // console.log(ohlcvArray);
  }
}
