import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const roleMenusTable = pgTable("role_menus", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  messageId: text("message_id").notNull(),
  roles: text("roles").notNull(),
});

export type RoleMenu = typeof roleMenusTable.$inferSelect;
