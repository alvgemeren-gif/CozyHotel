import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  link: text("link"),
  author: text("author"),
  categories: text("categories"),
  description: text("description"),
  rating: integer("rating").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  reviewerName: text("reviewer_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Review = typeof reviewsTable.$inferSelect;
