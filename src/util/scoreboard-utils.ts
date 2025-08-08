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

  const categoryMap = new Map<
    string,
    { subcategory: string; amount: number | null }[]
  >();
  let longestSubcategoryNameLength = 0;
  for (const row of result) {
    if (!row.subcategory) continue;
    if (row.subcategory.length > longestSubcategoryNameLength)
      longestSubcategoryNameLength = row.subcategory.length;
    const list = categoryMap.get(row.category) || [];
    const amount = row.amount == null ? null : Number(row.amount);
    list.push({ subcategory: row.subcategory, amount });
    categoryMap.set(row.category, list);
  }

  const embed = new EmbedBuilder()
    .setColor(getThemeColor("primary"))
    .setTitle("Stand Scoreboard Logboek");

  for (const categoryName of categoryNames) {
    const subcategoriesForCategory = categoryMap.get(categoryName.name);
    if (!subcategoriesForCategory || !subcategoriesForCategory.length) continue;

    const value = stripIndents`\`\`\`py
        ${subcategoriesForCategory
          .map((sc) => {
            const line =
              (sc.subcategory + ":").padEnd(
                longestSubcategoryNameLength + 4,
                " ",
              ) + (sc.amount || 0);
            return line;
          })
          .join("\n")}\`\`\``;

    embed.addFields({ name: categoryName.name, value });
  }

  return embed;
}

export async function mutateScoreboard(client: Client, guildId: string) {
  const guildsResult = await client.db
    .select()
    .from(guilds)
    .where(eq(guilds.id, guildId));

  if (!guildsResult.length) return;
  const { scoreboard_message, log_channel } = guildsResult[0];
  if (!scoreboard_message || !log_channel) return;

  const channel = await client.channels.fetch(log_channel);
  if (!channel || !channel.isSendable()) return;

  const embedPromise = generateScoreboardEmbed(client, guildId);
  const messagePromise = channel.messages
    .fetch(scoreboard_message)
    .catch(() => null);

  const [embed, scoreboardMessage] = await Promise.all([
    embedPromise,
    messagePromise,
  ]);

  if (!scoreboardMessage) return;

  await scoreboardMessage.edit({ embeds: [embed] });
}
