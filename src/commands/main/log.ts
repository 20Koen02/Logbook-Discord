import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { logs } from "../../db/schema";
import { checkGuildOk } from "../../util/check-guild";
import { color, createId, getThemeColor } from "../../util/util";
import { mutateScoreboard } from "../../util/scoreboard-utils";
import {
  searchAutocomplete,
  executeGetCategoryAndSubcategory,
} from "../../util/category-utils";
import { stripIndents } from "common-tags";
import { reply } from "../../util/reply";

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
    const amount = interaction.options.getNumber("aantal");
    const search = interaction.options.getString("zoeken");

    console.log(
      color(
        "text",
        `User ${color("variable", interaction.user.username)} (${interaction.user.id}) executed log command (reason: ${color("variable", reason)}, amount: ${color("variable", amount)}, search: ${color("variable", search)}) in guild ${color("variable", interaction.guildId)}`,
      ),
    );

    const result = await executeGetCategoryAndSubcategory(interaction, search);

    if (!result) return;

    const { category, subcategory } = result;

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

      await logMessage.react("👍");
      logMessage.react("👎");

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
