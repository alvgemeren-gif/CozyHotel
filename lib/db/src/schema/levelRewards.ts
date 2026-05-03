import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

export const levelRewardsTable = pgTable("level_rewards", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  level: integer("level").notNull(),
  roleId: text("role_id").notNull(),
  roleName: text("role_name").notNull(),
});

export type LevelReward = typeof levelRewardsTable.$inferSelect;
