// command that removes a subcategory. If the subcategory has logs, it will warn the user in a confirmation message that every log associated with the subcategory will be deleted

import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { checkGuildOk } from "../../util/check-guild";
import {
  searchAutocomplete,
  executeGetCategoryAndSubcategory,
} from "../../util/category-utils";
import { subcategories } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { mutateScoreboard } from "../../util/scoreboard-utils";
import { reply } from "../../util/reply";

const command: SlashCommand = {
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
      await reply(interaction, "Logboek kanaal is nog niet ingesteld!");
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

    await reply(
      interaction,
      `Subcategorie ${result.subcategory.name} (${result.subcategory.value}) is succesvol verwijderd!`,
    );

    await mutateScoreboard(interaction.client, interaction.guildId);
  },
};

export default command;
