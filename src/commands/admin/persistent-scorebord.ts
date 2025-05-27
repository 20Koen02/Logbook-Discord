import {
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../../types";
import { guilds } from "../../db/schema";
import { generateScoreboardEmbed } from "../../util/scoreboard-utils";
import { checkGuildOk } from "../../util/check-guild";
import { reply } from "../../util/reply";

const command: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("persistent-scorebord")
    .setDescription("Maakt een scorebord aan die door de bot wordt bijgewerkt")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild),
  execute: async (interaction) => {
    const logbookChannel = await checkGuildOk(interaction);

    if (!logbookChannel) {
      await reply(interaction, "Logboek kanaal is nog niet ingesteld!");
      return;
    }

    const embed = await generateScoreboardEmbed(
      interaction.client,
      interaction.guildId,
    );

    const sbMessage = await logbookChannel.send({ embeds: [embed] });

    await interaction.client.db
      .insert(guilds)
      .values({ id: interaction.guildId, scoreboard_message: sbMessage.id })
      // if the guild already exists, update the scoreboard_message
      .onConflictDoUpdate({
        target: guilds.id,
        set: { scoreboard_message: sbMessage.id },
      });

    await reply(
      interaction,
      `Scoreboard bericht is succesvol toegevoegd: ${sbMessage.url}`,
    );
  },
};

export default command;
