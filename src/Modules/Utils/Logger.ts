import chalk from "chalk";
import moment from "moment";

export default class Logger {
  static readonly source: string = "Main";
  static readonly SUCCESS = chalk.greenBright("SUCCESS");
  static readonly ERROR = chalk.red("ERROR");
  static readonly INFO = chalk.blueBright("INFO");

  constructor(private source: string = "Main") {}

  private static parseDate(date: number | Date) {
    const formatted = moment(new Date(date)).format("L hh:mm:SSS");
    return chalk.green(`[${formatted}]`);
  }
  static error(msg: string) {
    Logger.log(msg, this.ERROR);
  }
  error(msg: string) {
    Logger.error(msg);
  }

  static log(
    msg: string,
    type: string = this.INFO,
    timestamp: Date | number = new Date(),
    source: string = this.source
  ) {
    const TYPE = chalk.bold(type);
    const SOURCE = chalk.bgBlue(source);
    const TIMESTAMP = Logger.parseDate(timestamp);

    console.log(TIMESTAMP, TYPE, SOURCE, msg);
  }

  log(msg: string, type = Logger.INFO, timestamp: Date | number = new Date()) {
    Logger.log(msg, type, timestamp, this.source);
  }

  static success(msg: string) {
    Logger.log(msg, this.SUCCESS);
  }
  success(msg: string) {
    Logger.success(msg);
  }
}
