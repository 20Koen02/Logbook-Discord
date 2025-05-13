import env from "./env";
import "reflect-metadata";

import { drizzle } from "drizzle-orm/libsql";
import { Client, Collection, GatewayIntentBits } from "discord.js";
const { Guilds, MessageContent, GuildMessages } = GatewayIntentBits;
import { join } from "path";
import { readdir } from "fs/promises";
import { Command } from "./types";

const client = new Client({ intents: [Guilds, MessageContent, GuildMessages] });
client.commands = new Collection<string, Command>();
client.db = drizzle(process.env.DB_FILE_NAME!);

(async () => {
  const handlersDir = join(__dirname, "handlers");
  const handlerFiles = await readdir(handlersDir);

  await Promise.all(
    handlerFiles.map(async (handler) => {
      (await import(`${handlersDir}/${handler}`)).default(client);
    }),
  );

  client.login(env.TOKEN);
})();
