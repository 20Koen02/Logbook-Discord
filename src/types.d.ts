import {
  AutocompleteInteraction,
  Awaitable,
  ChatInputCommandInteraction,
  ClientEvents,
  Collection,
  SharedSlashCommand,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { drizzle } from "drizzle-orm/libsql";

type Command = SlashCommand & ContextMenuCommand;

export interface SlashCommand {
  command: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Awaitable<void>;
}

export interface ContextMenuCommand {
  command: ContextMenuCommandBuilder;
  execute: (
    interaction: MessageContextMenuCommandInteraction,
  ) => Awaitable<void>;
}

export interface BotEvent {
  name: keyof ClientEvents;
  once?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute: (...args: any[]) => Awaitable<void>;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
    db: ReturnType<typeof drizzle>;
  }
}
