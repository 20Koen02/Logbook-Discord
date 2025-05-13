import { Client } from "discord.js";
import { join } from "path";
import { BotEvent } from "../types";
import { color } from "../util/util";
import { readdir } from "fs/promises";

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

      console.log(
        color("text", `🌠 Loaded event ${color("variable", event.name)}`),
      );
    }),
  );
};

export default event;
