import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import { guilds } from "../../db/schema";

const command: Command = {
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
      .values({
        id: interaction.guildId,
        log_channel: interaction.channelId,
      })
      // if the guild already exists, update the log_channel
      .onConflictDoUpdate({
        target: guilds.id,
        set: { log_channel: interaction.channelId },
      });

    await interaction.reply({
      content: `Het logboekkanaal is succesvol ingesteld op ${interaction.channel}`,
    });
  },
};

export default command;
