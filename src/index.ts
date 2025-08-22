import { ShardingManager } from "discord.js";
import env from "./env";
import { logger } from "./logger";

const manager = new ShardingManager("dist/src/bot.js", {
  token: env.TOKEN,
});

manager.on("shardCreate", (shard) =>
  logger.info(`Registered Shard ${shard.id}`),
);

manager.spawn().then(() => {
  logger.info("Shards are now running");
});
