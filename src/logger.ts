import { createLogger, format, transports } from "winston";

function rest(info) {
  return JSON.stringify(
    Object.assign({}, info, {
      timestamp: undefined,
      level: undefined,
      message: undefined,
    }),
  );
}

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.align(),
    format.splat(),
    format.printf((info) => {
      const r = rest(info);
      return `${info.timestamp} [${info.level}]: ${info.message} ${r !== "{}" ? r : ""}`;
    }),
  ),

  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/combined.log" }),
    new transports.Console(),
  ],
});
