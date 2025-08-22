import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { logs } from "../../db/schema";
import { checkGuildOk } from "../../util/check-guild";
import { getThemeColor } from "../../util/util";
import { mutateScoreboard } from "../../util/scoreboard-utils";
import {
  searchAutocomplete,
  executeGetCategoryAndSubcategory,
} from "../../util/category-utils";
import { stripIndents } from "common-tags";
import { reply } from "../../util/reply";
import { logger } from "../../logger";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("log")
    .setDescription("Voeg een gebeurtenis toe aan het logboek")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("bewijs")
        .setDescription("Bijvoorbeeld de reden of een Message Link")
        .setRequired(true),
    )
    .addNumberOption((option) =>
      option
        .setName("aantal")
        .setDescription("Hoeveel moet ik aan het logboek toevoegen?")
        .setRequired(true)
        .setMinValue(1),
    )
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

    const reason = interaction.options.getString("bewijs");
    let amount = interaction.options.getNumber("aantal");
    const search = interaction.options.getString("zoeken");

    if (["[object Object]", "undefined", "null", "NaN", ""].includes(reason)) {
      await reply(
        interaction,
        "Geef een geldige reden op (stop fucking around)",
      );
      return;
    }

    if (reason.length > 1000) {
      await reply(
        interaction,
        "Geef een geldige reden op (maximaal 1000 tekens)",
      );
      return;
    }

    if (!Number.isFinite(amount)) {
      await reply(interaction, "Geef een geldig aantal op");
      return;
    }

    amount = Math.floor(amount);

    if (amount < 1 || amount > 1_000_000_000) {
      await reply(interaction, "Geef een geldig aantal op");
      return;
    }

    logger.info(`User ${interaction.user.username} executed log command`, {
      reason,
      amount,
      search,
      user: interaction.user.username,
      userId: interaction.user.id,
      guild: interaction.guildId,
      guildName: interaction.guild.name,
    });

    const result = await executeGetCategoryAndSubcategory(interaction, search);
    if (!result) return;

    const { category, subcategory } = result;

    logger.info(`Adding log entry`, {
      reason,
      amount,
      user: interaction.user.username,
      userId: interaction.user.id,
      categoryId: category.id,
      category: category.name,
      subcategoryId: subcategory.id,
      subcategory: subcategory.name,
      guildId: interaction.guildId,
      guild: interaction.guild.name,
    });

    try {
      const unitFormatted = subcategory.unit ? subcategory.unit + " " : "";
      const embed = new EmbedBuilder()
        .setColor(getThemeColor())
        .setTitle(`+${amount} ${unitFormatted}${subcategory.name}`)
        .setDescription(
          stripIndents`${reason}
          Toegevoegd door ${interaction.user}`,
        )
        .setFooter({
          text: `${category.name} › ${subcategory.name}`,
          iconURL: interaction.user.avatarURL(),
        });
      const logMessage = await logbookChannel.send({ embeds: [embed] });

      await logMessage.react("👍");
      logMessage.react("👎");

      await interaction.client.db
        .insert(logs)
        .values({
          guild: interaction.guildId,
          category: category.id,
          subcategory: subcategory.id,
          amount: amount,
          reason: reason,
          added_by: interaction.user.id,
          log_message: logMessage.id,
        })
        .returning();
    } catch (e) {
      logger.error("Error adding log entry", e);
      await reply(
        interaction,
        "Er is een fout opgetreden bij het toevoegen van de gebeurtenis!",
      );
      return;
    }

    await mutateScoreboard(interaction.client, interaction.guildId);

    await reply(interaction, `Gebeurtenis toegevoegd in ${logbookChannel}!`);
  },
};

export default command;
