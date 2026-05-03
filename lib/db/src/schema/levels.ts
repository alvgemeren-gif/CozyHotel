import { pgTable, text, integer, serial, bigint, uniqueIndex } from "drizzle-orm/pg-core";

export const levelsTable = pgTable(
  "levels",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    guildId: text("guild_id").notNull(),
    username: text("username").notNull().default(""),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(0),
    lastXpGain: bigint("last_xp_gain", { mode: "number" }),
  },
  (t) => [uniqueIndex("levels_user_guild_idx").on(t.userId, t.guildId)],
);

export type Level = typeof levelsTable.$inferSelect;
