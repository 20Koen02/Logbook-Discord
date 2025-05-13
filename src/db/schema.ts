import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, unique } from "drizzle-orm/sqlite-core";
import { createId } from "../util/util";

export const guilds = sqliteTable("guilds", {
  id: text().primaryKey(), // discord guild id
  log_channel: text(), // discord channel id
  scoreboard_message: text(), // discord message id
});

export type Guilds = typeof guilds.$inferSelect;

// Totale hoeveelheid van een subcategorie kan opgehaald worden met SUM()
export const logs = sqliteTable("logs", {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId()),
  guild: text()
    .notNull()
    .references(() => guilds.id), // discord guild id

  category: text()
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  subcategory: text()
    .notNull()
    .references(() => subcategories.id, { onDelete: "cascade" }),

  amount: integer().notNull(), // subcategory.unit is de eenheid
  reason: text().notNull(), // reason (bijv. met message link)

  log_message: text().notNull(), // discord message id

  added_by: text().notNull(), // discord user id

  created_at: text("timestamp")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Logs = typeof logs.$inferSelect;

export const categories = sqliteTable(
  "categories",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),

    guild: text()
      .notNull()
      .references(() => guilds.id), // discord guild id
    name: text().notNull(),
    value: text().notNull(), // kebab-case of label
  },
  (table) => ({
    unq: unique().on(table.guild, table.value),
  }),
);

export type Categories = typeof categories.$inferSelect;

export const subcategories = sqliteTable(
  "subcategories",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),

    guild: text()
      .notNull()
      .references(() => guilds.id), // discord guild id

    category: text()
      .notNull()
      .references(() => categories.id),

    name: text().notNull(),
    value: text().notNull(), // kebab-case of label
    unit: text(), // bijv. euro of maanden
  },
  (table) => ({
    unq: unique().on(table.guild, table.category, table.value),
  }),
);

export type Subcategories = typeof subcategories.$inferSelect;
