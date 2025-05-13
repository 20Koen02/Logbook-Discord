import { Events, Interaction } from "discord.js";
import { BotEvent } from "../types";

const errorPayload = {
  content: "There was an error while executing this command!",
  ephemeral: true, // only the user who executed the command sees the error
};

const event: BotEvent = {
  name: Events.InteractionCreate,
  execute: async (interaction: Interaction) => {
    const isCommand = interaction.isChatInputCommand();
    const isAutocomplete = interaction.isAutocomplete();

    if (!isCommand && !isAutocomplete) return;

    if (isCommand || isAutocomplete) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      if (isCommand) {
        try {
          command.execute(interaction);
        } catch (error) {
          console.error(error);
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorPayload);
          } else {
            await interaction.reply(errorPayload);
          }
        }
      } else if (isAutocomplete && command.autocomplete) {
        try {
          command.autocomplete(interaction);
        } catch (error) {
          console.error(error);
        }
      }
    }
  },
};

export default event;
