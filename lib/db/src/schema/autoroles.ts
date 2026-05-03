import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const autorolesTable = pgTable("autoroles", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  roleId: text("role_id").notNull(),
  roleName: text("role_name").notNull(),
});

export type Autorole = typeof autorolesTable.$inferSelect;
