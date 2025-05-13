import {
  Events,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
} from "discord.js";
import { BotEvent } from "../types";
import { guilds, logs } from "../db/schema";
import { eq } from "drizzle-orm";
import { mutateScoreboard } from "../util/scoreboard-utils";

const event: BotEvent = {
  name: Events.MessageDelete,
  execute: async (
    message: OmitPartialGroupDMChannel<Message | PartialMessage>,
  ) => {
    const guildsResult = await message.client.db
      .select()
      .from(guilds)
      .where(eq(guilds.id, message.guildId));

    if (!guildsResult.length || !guildsResult[0].log_channel) return;

    const logbookChannel = await message.client.channels.fetch(
      guildsResult[0].log_channel,
    );

    if (!logbookChannel) return;
    if (!logbookChannel.isSendable()) return;

    if (message.channel.id !== logbookChannel.id) return;

    // Message is in the logbook channel, delete it from the database if it exists
    const deleted = await message.client.db
      .delete(logs)
      .where(eq(logs.log_message, message.id))
      .returning();

    if (deleted.length) {
      await mutateScoreboard(message.client, message.guildId);
    }
  },
};

export default event;
