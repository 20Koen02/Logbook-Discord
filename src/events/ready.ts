import { ActivityType, Client, Events } from "discord.js";
import { BotEvent } from "../types";
import { mutateScoreboard } from "../util/scoreboard-utils";
import { logger } from "../logger";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client) => {
    if (!client.user) throw new Error("Client user is undefined");
    client.user.setActivity("Koen", { type: ActivityType.Watching });

    logger.info(`Logged in as ${client.user?.tag}`);

    for (const guild of await client.guilds.fetch()) {
      await mutateScoreboard(client, guild[0]);
    }
  },
};

export default event;
