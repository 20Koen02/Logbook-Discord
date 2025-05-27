// command that removes an empty category. If the category has subcategories, it will show an error message with the linked subcategories

import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { categories, subcategories } from "../../db/schema";
import { checkGuildOk } from "../../util/check-guild";
import { and, eq } from "drizzle-orm";
import { capitalize, toKebabCase } from "../../util/util";
import { stripIndents } from "common-tags";
import { mutateScoreboard } from "../../util/scoreboard-utils";
import { reply } from "../../util/reply";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("remove-categorie")
    .setDescription("Verwijdert een categorie als deze leeg is")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("categorie")
        .setDescription("Categorie van de gebeurtenis")
        .setRequired(true)
        .setAutocomplete(true),
    ),
  autocomplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused();

    const choices = await interaction.client.db
      .select()
      .from(categories)
      .where(eq(categories.guild, interaction.guildId));

    const filtered = choices.filter((choice) =>
      choice.name.startsWith(focusedValue),
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice.name, value: choice.id })),
    );
  },
  execute: async (interaction) => {
    if (!(await checkGuildOk(interaction))) {
      await reply(interaction, "Logboek kanaal is nog niet ingesteld!");
      return;
    }

    const category = interaction.options.getString("categorie");
    const categoryName = capitalize(category);
    const categoryValue = toKebabCase(category);

    const categoriesResult = await interaction.client.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.guild, interaction.guildId),
          eq(categories.id, category),
        ),
      );

    if (!categoriesResult.length) {
      await reply(
        interaction,
        `Categorie ${categoryName} (${categoryValue}) bestaat niet!`,
      );
      return;
    }

    const subcategoriesResult = await interaction.client.db
      .select()
      .from(subcategories)
      .where(
        and(
          eq(subcategories.guild, interaction.guildId),
          eq(subcategories.category, categoriesResult[0].id),
        ),
      );

    if (subcategoriesResult.length) {
      await reply(
        interaction,
        stripIndents`Categorie ${categoriesResult[0].name} (${categoriesResult[0].value}) heeft nog gekoppelde subcategorieën! 
        Verwijder eerst de subcategorie(ën) \`${subcategoriesResult.map((subcategory) => subcategory.name).join(", ")}\` voordat je de categorie verwijdert.`,
      );
      return;
    } else {
      await interaction.client.db
        .delete(categories)
        .where(
          and(
            eq(categories.guild, interaction.guildId),
            eq(categories.id, categoriesResult[0].id),
          ),
        );

      await reply(
        interaction,
        `Categorie ${categoriesResult[0].name} (${categoriesResult[0].value}) is succesvol verwijderd!`,
      );

      await mutateScoreboard(interaction.client, interaction.guildId);
    }
  },
};

export default command;
