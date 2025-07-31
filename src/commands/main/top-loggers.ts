import {
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { getThemeColor } from "../../util/util";
import { count, desc, eq } from "drizzle-orm";
import { logs } from "../../db/schema";
import { stripIndents } from "common-tags";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("top-loggers")
    .setDescription("Lijst met de top 10 mensen die het vaakst hebben gelogd")
    .setContexts(InteractionContextType.Guild),

  execute: async (interaction) => {
    const topLoggers = await interaction.client.db
      .select({
        added_by: logs.added_by,
        event_count: count(logs.added_by),
      })
      .from(logs)
      .where(eq(logs.guild, interaction.guildId))
      .groupBy(logs.added_by)
      .orderBy(desc(count(logs.amount)))
      .limit(10);

    const topLoggersUsers = await Promise.all(
      topLoggers.map(async (logger) => {
        return {
          user: await interaction.client.users.fetch(logger.added_by),
          event_count: logger.event_count,
        };
      }),
    );

    const getMedal = (rank: number) => {
      if (rank === 0) return "🥇";
      if (rank === 1) return "🥈";
      if (rank === 2) return "🥉";
      return "";
    };

    const embed = new EmbedBuilder()
      .setColor(getThemeColor("primary"))
      .setTitle("Top Loggers")
      .setDescription(
        stripIndents`
        De top 10 mensen die het vaakst hebben gelogd

        ${topLoggersUsers
          .map((logger, i) => {
            return `${i + 1}. ${logger.user} ${logger.event_count} logs ${getMedal(i)}`;
          })
          .join("\n")}
      `,
      );

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
