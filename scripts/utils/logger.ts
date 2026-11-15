import { styleText } from "node:util";

const logger = {
  log(...messages: Array<unknown>) {
    console.log(`${styleText(["gray"], " LOG ")}`, ...messages);
  },

  info(...messages: Array<unknown>) {
    console.info(`${styleText(["bgBlue", "white"], " INFO ")}`, ...messages);
  },

  warn(...messages: Array<unknown>) {
    console.warn(`${styleText(["bgYellow", "black"], " WARN ")}`, ...messages);
  },

  error(...messages: Array<unknown>) {
    console.error(`${styleText(["bgRed", "white"], " ERROR ")}`, ...messages);
  },

  debug(...messages: Array<unknown>) {
    console.debug(`${styleText(["bgGray", "white"], " DEBUG ")}`, ...messages);
  },

  trace(...messages: Array<unknown>) {
    console.trace(`${styleText(["bgGray", "white"], " TRACE ")}`, ...messages);
  },
};

export default logger;