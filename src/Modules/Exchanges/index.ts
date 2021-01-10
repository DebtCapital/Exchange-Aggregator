import { BaseExchange } from "./BaseExchange";
import { Binance } from "./Binance";
import { Bitfinex } from "./Bitfinex";
import { Bitmex } from "./Bitmex";
import { Bybit } from "./Bybit";
import { CoinbasePro } from "./CoinbasePro";

class ExchangesAggregator {
  private _exchanges: Array<BaseExchange> = [];
  public start(exchanges: Array<any>) {
    exchanges.forEach((exchange) => {
      this._exchanges.push(new exchange());
    });
  }

  public searchTickers(exchange?: string, ticker?: string) {
    return this._exchanges
      .map(({ exchangeName, tickers }) => {
        return { exchangeName: exchangeName.toUpperCase(), tickers };
      })
      .filter(({ exchangeName }) => exchangeName === exchange || !exchange)
      .map(({ exchangeName, tickers }) => {
        if (ticker) {
          tickers = tickers.filter((tick) => tick.includes(ticker));
        }
        return { exchangeName, tickers };
      });
  }
}
const Exchanges = new ExchangesAggregator();
export { Binance, Bitfinex, Bitmex, Bybit, CoinbasePro, Exchanges };
