import { and, asc, eq, gte, lte } from "drizzle-orm";
import {
  AttachmentBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { logs } from "../../db/schema";
import { logger } from "../../logger";
import type { SlashCommand } from "../../types";
import {
  executeGetCategoryAndSubcategory,
  searchAutocomplete,
} from "../../util/category-utils";
import { checkGuildOk } from "../../util/check-guild";
import {
  GRAPH_FILE_NAME,
  renderGraph,
  toSqliteTimestamp,
} from "../../util/graph-utils";
import { reply } from "../../util/reply";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("graph")
    .setDescription("Toon een YTD grafiek voor een subcategorie")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName("zoeken")
        .setDescription("Zoek de subcategorie van de grafiek")
        .setAutocomplete(true),
    ),
  autocomplete: searchAutocomplete,
  execute: async (interaction) => {
    if (!(await checkGuildOk(interaction))) {
      await reply(interaction, "Logboek kanaal is nog niet ingesteld!");
      return;
    }

    const search = interaction.options.getString("zoeken");

    logger.info(`User ${interaction.user.username} executed graph command`, {
      search,
      user: interaction.user.username,
      userId: interaction.user.id,
      guild: interaction.guildId!,
      guildName: interaction.guild!.name,
    });

    const result = await executeGetCategoryAndSubcategory(interaction, search);
    if (!result) return;

    const { category, subcategory } = result;
    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    const data = await interaction.client.db
      .select({
        amount: logs.amount,
        created_at: logs.created_at,
      })
      .from(logs)
      .where(
        and(
          eq(logs.guild, interaction.guildId!),
          eq(logs.subcategory, subcategory.id),
          gte(logs.created_at, toSqliteTimestamp(startOfYear)),
          lte(logs.created_at, toSqliteTimestamp(now)),
        ),
      )
      .orderBy(asc(logs.created_at));

    if (!data.length) {
      await reply(
        interaction,
        `Er zijn dit jaar nog geen gegevens voor ${subcategory.name}.`,
      );
      return;
    }

    try {
      const imageBuffer = await renderGraph(
        data,
        category.name,
        subcategory.name,
        startOfYear,
        now,
      );
      const attachment = new AttachmentBuilder(imageBuffer, {
        name: GRAPH_FILE_NAME,
      });

      const payload = {
        files: [attachment],
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    } catch (error) {
      logger.error("Error rendering graph", error);
      await reply(
        interaction,
        "Er is een fout opgetreden bij het renderen van de grafiek!",
      );
    }
  },
};

export default command;
