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

    if (topLoggers.length === 0) {
      await interaction.reply({
        content: "Er zijn nog geen logs.",
        ephemeral: true,
      });
      return;
    }

    const getMedal = (rank: number) => {
      if (rank === 0) return "🥇";
      if (rank === 1) return "🥈";
      if (rank === 2) return "🥉";
      return "";
    };

    const lines = topLoggers.map((row, i) =>
      `${i + 1}. <@${row.added_by}> ${row.event_count} logs ${getMedal(i)}`.trim(),
    );

    const embed = new EmbedBuilder()
      .setColor(getThemeColor())
      .setTitle("Top Loggers")
      .setDescription(
        stripIndents`
        De top 10 mensen die het vaakst hebben gelogd

        ${lines.join("\n")}
      `,
      );

    await interaction.reply({ embeds: [embed] });
  },
};

export default command;
