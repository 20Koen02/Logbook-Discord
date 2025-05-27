import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../../types";
import { stripIndents } from "common-tags";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping the bot"),
  execute: async (interaction) => {
    const sent = await interaction.reply({
      content: "Ping?",
      withResponse: true,
      flags: MessageFlags.Ephemeral,
    });
    interaction.editReply(stripIndents`
      🏓 Pong!
      Roundtrip: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp} ms
      `);
  },
};

export default command;
