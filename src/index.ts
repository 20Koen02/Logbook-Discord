import { ShardingManager } from "discord.js";
import env from "./env";
import { color } from "./util/util";

const manager = new ShardingManager("dist/src/bot.js", {
  token: env.TOKEN,
});

manager.on("shardCreate", (shard) =>
  console.log(
    color("primary", `💎 Registered Shard ${color("variable", shard.id)}`),
  ),
);

manager.spawn().then(() => {
  console.log(color("primary", "🚀 Shards are now running"));
});
