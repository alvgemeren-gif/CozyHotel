import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { RECIPE_CATEGORIES } from "../commands/review";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

const pendingReviews = new Map<string, {
  type: "recept";
  title: string;
  link: string;
  rating: number;
  description?: string;
}>();

function starRating(n: number): string {
  return "⭐".repeat(n) + "☆".repeat(5 - n) + ` (${n}/5)`;
}

export async function handleReviewRecept(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString("titel", true);
  const link = interaction.options.getString("link", true);
  const rating = interaction.options.getInteger("rating", true);
  const description = interaction.options.getString("beschrijving") ?? undefined;

  pendingReviews.set(interaction.user.id, { type: "recept", title, link, rating, description });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`review_categories:${interaction.user.id}`)
    .setPlaceholder("Selecteer categorieën (meerdere mogelijk)")
    .setMinValues(1)
    .setMaxValues(5)
    .addOptions(RECIPE_CATEGORIES);

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: "**Kies de categorieën voor jouw receptreview:**",
    components: [row],
    ephemeral: true,
  });
}

export async function handleReviewCategories(interaction: StringSelectMenuInteraction) {
  const userId = interaction.customId.split(":")[1]!;
  const pending = pendingReviews.get(userId);

  if (!pending) {
    await interaction.reply({ content: "Review sessie verlopen. Probeer opnieuw.", ephemeral: true });
    return;
  }

  pendingReviews.delete(userId);

  const categories = interaction.values.join(", ");

  await db.insert(reviewsTable).values({
    guildId: interaction.guildId!,
    type: "recept",
    title: pending.title,
    link: pending.link,
    rating: pending.rating,
    categories,
    description: pending.description,
    reviewerId: interaction.user.id,
    reviewerName: interaction.user.username,
  });

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🍽️ Receptreview")
    .setDescription(`**${pending.title}**`)
    .addFields(
      { name: "🔗 Link", value: `[Bekijk recept](${pending.link})`, inline: true },
      { name: "⭐ Beoordeling", value: starRating(pending.rating), inline: true },
      { name: "🏷️ Categorieën", value: categories },
      ...(pending.description ? [{ name: "📝 Beschrijving", value: pending.description }] : [])
    )
    .setFooter({ text: `Review door ${interaction.user.username} • Hotel Restaurantgids` })
    .setTimestamp();

  await interaction.update({ content: "✅ Review geplaatst!", components: [] });
  await interaction.channel?.send({ embeds: [embed] });
}

export async function handleReviewDrank(interaction: ChatInputCommandInteraction) {
  const naam = interaction.options.getString("naam", true);
  const soort = interaction.options.getString("soort", true);
  const rating = interaction.options.getInteger("rating", true);
  const description = interaction.options.getString("beschrijving") ?? undefined;

  await db.insert(reviewsTable).values({
    guildId: interaction.guildId!,
    type: "drank",
    title: naam,
    categories: soort,
    rating,
    description,
    reviewerId: interaction.user.id,
    reviewerName: interaction.user.username,
  });

  const embed = new EmbedBuilder()
    .setColor(0x1E90FF)
    .setTitle("🥤 Drankreview")
    .setDescription(`**${naam}**`)
    .addFields(
      { name: "🍶 Soort", value: soort, inline: true },
      { name: "⭐ Beoordeling", value: starRating(rating), inline: true },
      ...(description ? [{ name: "📝 Smaaknotitie", value: description }] : [])
    )
    .setFooter({ text: `Review door ${interaction.user.username} • Hotel Bar` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleReviewBoek(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString("titel", true);
  const author = interaction.options.getString("schrijver", true);
  const rating = interaction.options.getInteger("rating", true);
  const description = interaction.options.getString("beschrijving") ?? undefined;

  await db.insert(reviewsTable).values({
    guildId: interaction.guildId!,
    type: "boek",
    title,
    author,
    rating,
    description,
    reviewerId: interaction.user.id,
    reviewerName: interaction.user.username,
  });

  const embed = new EmbedBuilder()
    .setColor(0x4B0082)
    .setTitle("📚 Boekreview")
    .setDescription(`**${title}**`)
    .addFields(
      { name: "✍️ Schrijver", value: author, inline: true },
      { name: "⭐ Beoordeling", value: starRating(rating), inline: true },
      ...(description ? [{ name: "📝 Recensie", value: description }] : [])
    )
    .setFooter({ text: `Review door ${interaction.user.username} • Hotel Bibliotheek` })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
