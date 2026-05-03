import { pgTable, text } from "drizzle-orm/pg-core";

export const guildConfigsTable = pgTable("guild_configs", {
  guildId: text("guild_id").primaryKey(),
  welcomeChannelId: text("welcome_channel_id"),
  leaveChannelId: text("leave_channel_id"),
  countingChannelId: text("counting_channel_id"),
  qotdChannelId: text("qotd_channel_id"),
  qotdLastSent: text("qotd_last_sent"),
  welcomeMessage: text("welcome_message"),
  leaveMessage: text("leave_message"),
});

export type GuildConfig = typeof guildConfigsTable.$inferSelect;
