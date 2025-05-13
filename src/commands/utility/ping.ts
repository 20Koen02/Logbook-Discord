import { SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { stripIndents } from "common-tags";

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping the bot"),
  execute: async (interaction) => {
    const sent = await interaction.reply({
      content: "Ping?",
      fetchReply: true,
      ephemeral: true,
    });
    interaction.editReply(stripIndents`
      🏓 Pong!
      Roundtrip: ${sent.createdTimestamp - interaction.createdTimestamp} ms
      `);
  },
};

export default command;
