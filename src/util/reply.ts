import {
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  MessageFlags,
} from "discord.js";

export const reply = async (
  interaction:
    | ChatInputCommandInteraction
    | MessageContextMenuCommandInteraction,
  content: string,
) => {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
  } else {
    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }
};
