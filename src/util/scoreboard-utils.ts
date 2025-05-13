import { Client, EmbedBuilder } from "discord.js";
import { getThemeColor } from "./util";
import { categories, guilds, logs, subcategories } from "../db/schema";
import { eq, sum } from "drizzle-orm";
import { stripIndents } from "common-tags";

export async function generateScoreboardEmbed(
  client: Client,
  guildId: string,
): Promise<EmbedBuilder> {
  const categoryNames = await client.db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.guild, guildId));

  const result = await client.db
    .select({
      category: categories.name,
      subcategory: subcategories.name,
      amount: sum(logs.amount),
    })
    .from(categories)
    .where(eq(categories.guild, guildId))
    .leftJoin(subcategories, eq(categories.id, subcategories.category))
    .leftJoin(logs, eq(subcategories.id, logs.subcategory))
    .groupBy(subcategories.category, subcategories.name);

  const longestSubcategoryNameLength = result.reduce((acc, subcategory) => {
    return Math.max(acc, subcategory.subcategory?.length || 0);
  }, 0);

  const embed = new EmbedBuilder()
    .setColor(getThemeColor("primary"))
    .setTitle("Stand Scoreboard Logboek");

  for (const categoryName of categoryNames) {
    const subcategoriesFiltered = result.filter(
      (subcategory) =>
        subcategory.subcategory && subcategory.category === categoryName.name,
    );

    if (!subcategoriesFiltered.length) continue;

    embed.addFields({
      name: categoryName.name,
      value: stripIndents`\`\`\`py
        ${subcategoriesFiltered
          .map((subcategory) => {
            const spaces = " ".repeat(
              longestSubcategoryNameLength -
                (subcategory.subcategory?.length || 0) +
                3,
            );
            return `${subcategory.subcategory}:${spaces}${subcategory.amount || 0}`;
          })
          .join("\n")}\`\`\``,
    });
  }

  return embed;
}

export async function mutateScoreboard(client: Client, guildId: string) {
  const guildsResult = await client.db
    .select()
    .from(guilds)
    .where(eq(guilds.id, guildId));

  if (
    !guildsResult.length ||
    !guildsResult[0].scoreboard_message ||
    !guildsResult[0].log_channel
  )
    return;

  const channel = await client.channels.fetch(guildsResult[0].log_channel);

  if (!channel) return;

  if (!channel.isSendable()) return;

  const scoreboardMessage = await channel.messages.fetch(
    guildsResult[0].scoreboard_message,
  );

  if (!scoreboardMessage) return;

  const embed = await generateScoreboardEmbed(client, guildId);
  await scoreboardMessage.edit({ embeds: [embed] });
}
