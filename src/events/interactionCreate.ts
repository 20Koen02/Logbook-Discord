import { Events, Interaction } from "discord.js";
import { BotEvent, ContextMenuCommand, SlashCommand } from "../types";
import { reply } from "../util/reply";

const event: BotEvent = {
  name: Events.InteractionCreate,
  execute: async (interaction: Interaction) => {
    const isCommand = interaction.isChatInputCommand();
    const isAutocomplete = interaction.isAutocomplete();
    const isContextMenu = interaction.isMessageContextMenuCommand();

    if (isCommand) {
      const command: SlashCommand = interaction.client.commands.get(
        interaction.commandName,
      );
      if (!command) return;
      try {
        command.execute(interaction);
      } catch (error) {
        console.error(error);
        await reply(
          interaction,
          "There was an error while executing this command!",
        );
      }
    } else if (isAutocomplete) {
      const command: SlashCommand = interaction.client.commands.get(
        interaction.commandName,
      );
      if (!command || !command.autocomplete) return;
      try {
        command.autocomplete(interaction);
      } catch (error) {
        console.error(error);
      }
    } else if (isContextMenu) {
      const command: ContextMenuCommand = interaction.client.commands.get(
        interaction.commandName,
      );
      if (!command) return;
      try {
        command.execute(interaction);
      } catch (error) {
        console.error(error);
        await reply(
          interaction,
          "There was an error while executing this command!",
        );
      }
    }
  },
};

export default event;
