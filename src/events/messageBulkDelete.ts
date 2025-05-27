import {
  Events,
  GuildTextBasedChannel,
  Message,
  OmitPartialGroupDMChannel,
  PartialMessage,
  ReadonlyCollection,
  Snowflake,
} from "discord.js";
import { BotEvent } from "../types";
import { guilds, logs } from "../db/schema";
import { eq } from "drizzle-orm";
import { mutateScoreboard } from "../util/scoreboard-utils";

const event: BotEvent = {
  name: Events.MessageBulkDelete,
  execute: async (
    messages: ReadonlyCollection<
      Snowflake,
      OmitPartialGroupDMChannel<Message | PartialMessage>
    >,
    channel: GuildTextBasedChannel,
  ) => {
    const guildsResult = await channel.client.db
      .select()
      .from(guilds)
      .where(eq(guilds.id, channel.guildId));

    if (!guildsResult.length || !guildsResult[0].log_channel) return;

    const logbookChannel = await channel.client.channels.fetch(
      guildsResult[0].log_channel,
    );

    if (!logbookChannel) return;
    if (!logbookChannel.isSendable()) return;

    if (channel.id !== logbookChannel.id) return;

    let mutated = false;

    // Messages are in the logbook channel, delete them from the database if they exists
    for (const message of messages.values()) {
      const deleted = await message.client.db
        .delete(logs)
        .where(eq(logs.log_message, message.id))
        .returning();

      if (deleted.length) mutated = true;
    }

    if (mutated) await mutateScoreboard(channel.client, channel.guildId);
  },
};

export default event;
