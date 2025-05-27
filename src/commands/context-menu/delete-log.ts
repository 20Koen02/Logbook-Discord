import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
} from "discord.js";
import { ContextMenuCommand } from "../../types";
import { logs } from "../../db/schema";
import { eq } from "drizzle-orm";
import { reply } from "../../util/reply";

const command: ContextMenuCommand = {
  command: new ContextMenuCommandBuilder()
    .setName("Verwijder mijn gebeurtenis")
    .setContexts(InteractionContextType.Guild)
    .setType(ApplicationCommandType.Message),
  execute: async (interaction) => {
    // The selected message must be from the bot
    if (interaction.targetMessage.author.id !== interaction.client.user.id)
      return reply(
        interaction,
        "Verwijderen mislukt. Deze interactie is alleen mogelijk op berichten van de bot!",
      );

    const logsResult = await interaction.client.db
      .select()
      .from(logs)
      .where(eq(logs.log_message, interaction.targetId));

    // The selected message must be in the database
    if (!logsResult.length)
      return reply(
        interaction,
        "Verwijderen mislukt. Gebeurtenis niet gevonden!",
      );

    // The event must be added by the user
    if (logsResult[0].added_by !== interaction.user.id)
      return reply(
        interaction,
        "Verwijderen mislukt. Deze gebeurtenis is niet door jou toegevoegd!",
      );

    const createdAt = new Date(
      logsResult[0].created_at.replace(" ", "T") + "Z",
    );

    // The event must be created not more than 1 hour ago
    if (new Date().getTime() - createdAt.getTime() > 60 * 60 * 1000)
      return reply(
        interaction,
        "Verwijderen mislukt. Je kan gebeurtenissen ouder dan 1 uur niet verwijderen!",
      );

    interaction.targetMessage
      .delete()
      .then(() => {
        reply(interaction, "Je gebeurtenis is succesvol verwijderd!");
      })
      .catch(() => {
        reply(
          interaction,
          "Er is een fout opgetreden bij het verwijderen van je gebeurtenis!",
        );
      });
  },
};

export default command;
