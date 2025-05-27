import {
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { generateScoreboardEmbed } from "../../util/scoreboard-utils";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("scorebord")
    .setDescription("Lijst van alle categorieën met de totale score")
    .setContexts(InteractionContextType.Guild),

  execute: async (interaction) => {
    const embed = await generateScoreboardEmbed(
      interaction.client,
      interaction.guildId,
    );
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

export default command;
