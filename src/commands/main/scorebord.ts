import { InteractionContextType, SlashCommandBuilder } from "discord.js";
import { Command } from "../../types";
import { generateScoreboardEmbed } from "../../util/scoreboard-utils";

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("scorebord")
    .setDescription("Lijst van alle categorieën met de totale score")
    .setContexts(InteractionContextType.Guild),

  execute: async (interaction) => {
    const embed = await generateScoreboardEmbed(
      interaction.client,
      interaction.guildId,
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

export default command;
