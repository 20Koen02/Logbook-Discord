// command that removes a subcategory. If the subcategory has logs, it will warn the user in a confirmation message that every log associated with the subcategory will be deleted

import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import { checkGuildOk } from "../../util/check-guild";
import {
  searchAutocomplete,
  executeGetCategoryAndSubcategory,
} from "../../util/category-utils";
import { subcategories } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { mutateScoreboard } from "../../util/scoreboard-utils";

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("remove-subcategorie")
    .setDescription("Verwijdert een subcategorie met alle bijbehorende logs")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("zoeken")
        .setDescription("Zoek de subcategorie van de gebeurtenis")
        .setAutocomplete(true),
    ),
  autocomplete: searchAutocomplete,
  execute: async (interaction) => {
    const logbookChannel = await checkGuildOk(interaction);

    if (!logbookChannel) {
      await interaction.reply({
        content: "Logboek kanaal is nog niet ingesteld!",
        ephemeral: true,
      });
      return;
    }

    const search = interaction.options.getString("zoeken");

    const result = await executeGetCategoryAndSubcategory(interaction, search);

    if (!result) return;

    await interaction.client.db
      .delete(subcategories)
      .where(
        and(
          eq(subcategories.guild, interaction.guildId),
          eq(subcategories.id, result.subcategory.id),
        ),
      );

    await interaction.reply({
      content: `Subcategorie ${result.subcategory.name} (${result.subcategory.value}) is succesvol verwijderd!`,
      ephemeral: true,
    });

    await mutateScoreboard(interaction.client, interaction.guildId);
  },
};

export default command;
