import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const guildConfigsTable = pgTable("guild_configs", {
  guildId: text("guild_id").primaryKey(),
  welcomeChannelId: text("welcome_channel_id"),
  leaveChannelId: text("leave_channel_id"),
  countingChannelId: text("counting_channel_id"),
  qotdChannelId: text("qotd_channel_id"),
  qotdLastSent: text("qotd_last_sent"),
  welcomeMessage: text("welcome_message"),
  leaveMessage: text("leave_message"),
  starboardChannelId: text("starboard_channel_id"),
  starboardEmoji: text("starboard_emoji"),
  starboardMinimum: integer("starboard_minimum").default(3),
});

export type GuildConfig = typeof guildConfigsTable.$inferSelect;
