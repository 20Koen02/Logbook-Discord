import { and, eq } from "drizzle-orm";
import {
  Categories,
  categories,
  Subcategories,
  subcategories,
} from "../db/schema";
import {
  ChatInputCommandInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction,
  ComponentType,
  AutocompleteInteraction,
  CacheType,
  MessageFlags,
} from "discord.js";
import { reply } from "./reply";

export const executeGetCategoryAndSubcategory = async (
  interaction: ChatInputCommandInteraction,
  search: string,
) => {
  let category: Categories;
  let subcategory: Subcategories;

  if (search) {
    const subcategoryResult = await getSubcategoryById(interaction, search);
    if (subcategoryResult.length === 0) {
      await reply(interaction, "Subcategorie niet gevonden!");
      return;
    }
    subcategory = subcategoryResult[0];
    const categoryResult = await getCategoryById(
      interaction,
      subcategory.category,
    );
    category = categoryResult[0];
  } else {
    category = await askCategory(interaction);
    if (!category) {
      await reply(interaction, "Categorie niet gevonden!");
      return;
    }
    subcategory = await askSubcategory(interaction, category);
    if (!subcategory) {
      await reply(interaction, "Subcategorie niet gevonden!");
      return;
    }
  }
  return { category, subcategory };
};

export const searchAutocomplete = async (
  interaction: AutocompleteInteraction<CacheType>,
) => {
  const search = interaction.options.getFocused();

  const categoriesResult = await interaction.client.db
    .select()
    .from(categories)
    .where(eq(categories.guild, interaction.guildId));

  const subcategoriesResult = await interaction.client.db
    .select()
    .from(subcategories)
    .where(eq(subcategories.guild, interaction.guildId));

  const choices = subcategoriesResult.map((subcategory) => {
    const category = categoriesResult.find(
      (category) => category.id === subcategory.category,
    );

    return {
      name: `${category.name}: ${subcategory.name}`,
      value: subcategory.id,
    };
  });

  if (!choices) return;

  const filtered = choices.filter((choice) =>
    choice.name.toLowerCase().includes(search.toLowerCase()),
  );
  await interaction.respond(filtered);
};

export const getSubcategoryById = async (
  interaction: ChatInputCommandInteraction,
  id: string,
) => {
  return await interaction.client.db
    .select()
    .from(subcategories)
    .where(eq(subcategories.id, id));
};

export const getCategoryById = async (
  interaction: ChatInputCommandInteraction,
  id: string,
) => {
  return await interaction.client.db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
};

export const askCategory = async (interaction: ChatInputCommandInteraction) => {
  const allCategoriesResult = await interaction.client.db
    .select()
    .from(categories)
    .where(eq(categories.guild, interaction.guildId));

  const select = new StringSelectMenuBuilder()
    .setCustomId("category_select")
    .setPlaceholder("Selecteer een categorie")
    .addOptions(
      allCategoriesResult.map((category) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(category.name)
          .setValue(category.id);
      }),
    );

  const categoryRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const categoryReply = await interaction.reply({
    content: "Onder welke categorie wil je deze gebeurtenis toevoegen?",
    components: [categoryRow],
    flags: MessageFlags.Ephemeral,
  });

  let categoryConfirmation: StringSelectMenuInteraction;

  try {
    categoryConfirmation = await categoryReply.awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) => {
        i.deferUpdate();
        return i.user.id === interaction.user.id;
      },
      time: 60_000,
    });
  } catch {
    await categoryReply.delete();
    await interaction.followUp({
      content: "Je hebt niet binnen een minuut gekozen. Probeer het opnieuw.",
      components: [],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await categoryReply.delete();

  return allCategoriesResult.find(
    (category) => category.id === categoryConfirmation.values[0],
  );
};

export const askSubcategory = async (
  interaction: ChatInputCommandInteraction,
  category: Categories,
) => {
  const allSubcategoriesResult = await interaction.client.db
    .select()
    .from(subcategories)
    .where(
      and(
        eq(subcategories.guild, interaction.guildId),
        eq(subcategories.category, category.id),
      ),
    );

  const subcategorySelect = new StringSelectMenuBuilder()
    .setCustomId("subcategory_select")
    .setPlaceholder("Selecteer een subcategorie")
    .addOptions(
      allSubcategoriesResult.map((subcategory) => {
        return new StringSelectMenuOptionBuilder()
          .setLabel(subcategory.name)
          .setValue(subcategory.id);
      }),
    );

  const subcategoryRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      subcategorySelect,
    );

  const subcategoryReply = await interaction.followUp({
    content: "Onder welke subcategorie wil je deze gebeurtenis toevoegen?",
    components: [subcategoryRow],
    flags: MessageFlags.Ephemeral,
  });

  let subcategoryConfirmation: StringSelectMenuInteraction;

  try {
    subcategoryConfirmation =
      await subcategoryReply.awaitMessageComponent<ComponentType.StringSelect>({
        componentType: ComponentType.StringSelect,
        filter: (i) => {
          i.deferUpdate();
          return i.user.id === interaction.user.id;
        },
        time: 60_000,
      });
  } catch {
    await interaction.deleteReply(subcategoryReply);
    await interaction.followUp({
      content: "Je hebt niet binnen een minuut gekozen. Probeer het opnieuw.",
      components: [],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.deleteReply(subcategoryReply);

  return allSubcategoriesResult.find(
    (subcategory) => subcategory.id === subcategoryConfirmation.values[0],
  );
};
