import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import { capitalize, toKebabCase } from "../../util/util";
import { and, eq } from "drizzle-orm";
import { checkGuildOk } from "../../util/check-guild";
import { categories, subcategories } from "../../db/schema";
import { mutateScoreboard } from "../../util/scoreboard-utils";

const command: Command = {
  command: new SlashCommandBuilder()
    .setName("add-categorie")
    .setDescription("Voeg een categorie en subcategorie toe aan het logboek")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("categorie")
        .setDescription("Categorie van de gebeurtenis")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName("subcategorie")
        .setDescription("Subcategorie van de gebeurtenis")
        .setRequired(true)
    ),
  autocomplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused();

    const choices = await interaction.client.db
      .select()
      .from(categories)
      .where(eq(categories.guild, interaction.guildId));

    const filtered = choices.filter((choice) =>
      choice.name.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice.name, value: choice.id }))
    );
  },
  execute: async (interaction) => {
    if (!(await checkGuildOk(interaction))) {
      await interaction.reply({
        content: "Logboek kanaal is nog niet ingesteld!",
        ephemeral: true,
      });
      return;
    }

    let addedCategory = false;

    const category = interaction.options.getString("categorie");
    const categoryName = capitalize(category);
    const categoryValue = toKebabCase(category);

    let categoriesResult = await interaction.client.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.guild, interaction.guildId),
          eq(categories.id, category)
        )
      );

    if (categoriesResult.length === 0) {
      try {
        categoriesResult = await interaction.client.db
          .insert(categories)
          .values({
            guild: interaction.guildId,
            value: categoryValue,
            name: categoryName,
          })
          .returning();
      } catch {
        await interaction.reply({
          content:
            "Er is een fout opgetreden bij het toevoegen van de categorie!",
          ephemeral: true,
        });
        return;
      }

      addedCategory = true;
    }

    if (categoriesResult.length === 0) return;

    const subcategory = interaction.options.getString("subcategorie");
    const subcategoryName = capitalize(subcategory);
    const subcategoryValue = toKebabCase(subcategory);

    try {
      await interaction.client.db
        .insert(subcategories)
        .values({
          guild: interaction.guildId,
          category: categoriesResult[0].id,
          value: subcategoryValue,
          name: subcategoryName,
        })
        .returning();
    } catch {
      await interaction.reply({
        content:
          "Er is een fout opgetreden bij het toevoegen van de subcategorie!",
        ephemeral: true,
      });
      return;
    }

    let message = addedCategory
      ? `De categorie ${categoryName} (${categoryValue}) is toegevoegd\n`
      : "";
    message += `De subcategorie ${subcategoryName} (${subcategoryValue}) is toegevoegd aan de categorie ${categoryName} (${categoryValue})`;

    await interaction.reply(message);
    await mutateScoreboard(interaction.client, interaction.guildId);
  },
};

export default command;
