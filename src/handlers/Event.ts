import { Client } from "discord.js";
import { join } from "path";
import { BotEvent } from "../types";
import { readdir } from "fs/promises";
import { logger } from "../logger";

const event = async (client: Client) => {
  const eventsDir = join(__dirname, "../events");
  const eventFiles = await readdir(eventsDir);

  await Promise.all(
    eventFiles.map(async (file) => {
      const event: BotEvent = (await import(`${eventsDir}/${file}`)).default;

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }

      logger.info(`Loaded event ${event.name}`);
    }),
  );
};

export default event;
