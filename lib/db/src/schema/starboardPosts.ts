import { pgTable, text, bigint } from "drizzle-orm/pg-core";

export const starboardPostsTable = pgTable("starboard_posts", {
  messageId: text("message_id").primaryKey(),
  guildId: text("guild_id").notNull(),
  starboardMessageId: text("starboard_message_id").notNull(),
  postedAt: bigint("posted_at", { mode: "number" }).notNull(),
});

export type StarboardPost = typeof starboardPostsTable.$inferSelect;
