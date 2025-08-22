import { Client, REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";
import { Command } from "../types";
import env from "../env";
import { logger } from "../logger";

const command = async (client: Client) => {
  const commandsDir = join(__dirname, "../commands");
  const commandFolders = await readdir(commandsDir);

  await Promise.all(
    commandFolders.map(async (folder) => {
      const files = await readdir(`${commandsDir}/${folder}`);
      await Promise.all(
        files.map(async (file) => {
          const command: Command = (
            await import(`${commandsDir}/${folder}/${file}`)
          ).default;

          client.commands.set(command.command.name, command);
          logger.info(`Loaded command ${command.command.name}`);
        }),
      );
    }),
  );

  const rest = new REST({ version: "10" }).setToken(env.TOKEN);

  rest
    .put(Routes.applicationCommands(env.CLIENT_ID), {
      body: client.commands.map((c) => c.command.toJSON()),
    })
    .then((data) => {
      logger.info(`Registered ${(data as object[]).length} command(s)`);
    })
    .catch((e) => {
      logger.error("Error registering commands", e);
    });
};

export default command;
