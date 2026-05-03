import { pgTable, text, integer, serial, bigint, uniqueIndex } from "drizzle-orm/pg-core";

export const economyTable = pgTable(
  "economy",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    guildId: text("guild_id").notNull(),
    balance: integer("balance").notNull().default(1000),
    lastWork: bigint("last_work", { mode: "number" }),
    lastSteal: bigint("last_steal", { mode: "number" }),
  },
  (t) => [uniqueIndex("economy_user_guild_idx").on(t.userId, t.guildId)],
);

export type Economy = typeof economyTable.$inferSelect;
