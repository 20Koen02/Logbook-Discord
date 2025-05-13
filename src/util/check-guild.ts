import { ChatInputCommandInteraction, SendableChannels } from "discord.js";
import { guilds } from "../db/schema";
import { eq } from "drizzle-orm";

export const checkGuildOk = async (
  interaction: ChatInputCommandInteraction,
): Promise<SendableChannels | null> => {
  // get guild from database
  const guildsResult = await interaction.client.db
    .select()
    .from(guilds)
    .where(eq(guilds.id, interaction.guildId));

  if (!guildsResult.length || !guildsResult[0].log_channel) return null;

  const channel = await interaction.client.channels.fetch(
    guildsResult[0].log_channel,
  );

  if (!channel) return null;

  if (!channel.isSendable()) return null;

  return channel;
};
