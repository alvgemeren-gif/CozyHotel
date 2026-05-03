import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const countingTable = pgTable("counting", {
  guildId: text("guild_id").primaryKey(),
  count: integer("count").notNull().default(0),
  lastUserId: text("last_user_id"),
  highScore: integer("high_score").notNull().default(0),
});

export type Counting = typeof countingTable.$inferSelect;
