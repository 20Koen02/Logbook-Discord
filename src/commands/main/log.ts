import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { Command } from "../../types";
import { logs } from "../../db/schema";
import { checkGuildOk } from "../../util/check-guild";
import { createId, getThemeColor } from "../../util/util";
import { mutateScoreboard } from "../../util/scoreboard-utils";
import {
  searchAutocomplete,
  executeGetCategoryAndSubcategory,
} from "../../util/category-utils";
import { stripIndents } from "common-tags";

const command: Command = {
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
        .setName("hoeveelheid")
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
      await interaction.reply({
        content: "Logboek kanaal is nog niet ingesteld!",
        ephemeral: true,
      });
      return;
    }

    const reason = interaction.options.getString("bewijs");
    const amount = interaction.options.getNumber("hoeveelheid");
    const search = interaction.options.getString("zoeken");

    const { category, subcategory } = await executeGetCategoryAndSubcategory(
      interaction,
      search,
    );

    const logId = createId();

    try {
      const unitFormatted = subcategory.unit ? subcategory.unit + " " : "";
      const embed = new EmbedBuilder()
        .setColor(getThemeColor("primary"))
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

      await interaction.client.db
        .insert(logs)
        .values({
          id: logId,
          guild: interaction.guildId,
          category: category.id,
          subcategory: subcategory.id,
          amount: amount,
          reason: reason,
          added_by: interaction.user.id,
          log_message: logMessage.id,
        })
        .returning();
    } catch {
      const errMsg = {
        content:
          "Er is een fout opgetreden bij het toevoegen van de gebeurtenis!",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errMsg);
      } else {
        await interaction.reply(errMsg);
      }
      return;
    }

    await mutateScoreboard(interaction.client, interaction.guildId);

    const successMsg = {
      content: `Gebeurtenis toegevoegd in ${logbookChannel}!`,
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(successMsg);
    } else {
      await interaction.reply(successMsg);
    }
  },
};

export default command;
