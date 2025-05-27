import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { guilds } from "../../db/schema";
import { reply } from "../../util/reply";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("set-channel")
    .setDescription(
      "Voer dit commando uit in het logboekkanaal of de thread waarin u gebeurtenissen wilt bijhouden",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild),
  execute: async (interaction) => {
    await interaction.client.db
      .insert(guilds)
      .values({ id: interaction.guildId, log_channel: interaction.channelId })
      // if the guild already exists, update the log_channel
      .onConflictDoUpdate({
        target: guilds.id,
        set: { log_channel: interaction.channelId },
      });

    await reply(
      interaction,
      `Het logboekkanaal is succesvol ingesteld op ${interaction.channel}`,
    );
  },
};

export default command;
