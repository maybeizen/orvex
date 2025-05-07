const chalk = require("chalk");

class Logger {
  constructor() {
    this.log = console.log;

    this.info = this.info.bind(this);
    this.error = this.error.bind(this);
    this.success = this.success.bind(this);
    this.warn = this.warn.bind(this);
    this.debug = this.debug.bind(this);
    this.formatLog = this.formatLog.bind(this);
  }

  getTimestamp() {
    return new Date().toLocaleTimeString("en-US", { hour12: false });
  }

  formatLog(color, tag, message) {
    this.log(
      chalk.gray(`[${this.getTimestamp()}]`) +
        chalk[color](` (${tag}) ${message}`)
    );
  }

  info(message) {
    this.formatLog("cyan", "INFO", message);
  }

  error(message) {
    this.formatLog("red", "ERROR", message);
  }

  success(message) {
    this.formatLog("green", "SUCCESS", message);
  }

  warn(message) {
    this.formatLog("yellow", "WARN", message);
  }

  debug(message) {
    this.formatLog("gray", "DEBUG", message);
  }
}

const logger = new Logger();
module.exports = logger;
