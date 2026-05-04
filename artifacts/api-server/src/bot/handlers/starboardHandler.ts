import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageReaction,
  User,
  TextChannel,
  PartialMessageReaction,
  PartialUser,
} from "discord.js";
import { db } from "@workspace/db";
import { guildConfigsTable, starboardPostsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

export async function handleStarboardSetup(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("kanaal", true) as TextChannel;
  const emoji = interaction.options.getString("emoji", true).trim();
  const minimum = interaction.options.getInteger("minimum") ?? 3;

  await db
    .insert(guildConfigsTable)
    .values({
      guildId: interaction.guildId!,
      starboardChannelId: channel.id,
      starboardEmoji: emoji,
      starboardMinimum: minimum,
    })
    .onConflictDoUpdate({
      target: guildConfigsTable.guildId,
      set: {
        starboardChannelId: channel.id,
        starboardEmoji: emoji,
        starboardMinimum: minimum,
      },
    });

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("⭐ Starboard ingesteld")
    .addFields(
      { name: "Kanaal", value: `${channel}`, inline: true },
      { name: "Emoji", value: emoji, inline: true },
      { name: "Minimum reacties", value: `${minimum}`, inline: true }
    )
    .setFooter({ text: "Hotel Starboard" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleStarboardInfo(interaction: ChatInputCommandInteraction) {
  const config = await db.query.guildConfigsTable.findFirst({
    where: eq(guildConfigsTable.guildId, interaction.guildId!),
  });

  if (!config?.starboardChannelId) {
    await interaction.reply({
      content: "❌ Er is nog geen starboard ingesteld. Gebruik `/starboard-setup`.",
      ephemeral: true,
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("⭐ Starboard instellingen")
    .addFields(
      { name: "Kanaal", value: `<#${config.starboardChannelId}>`, inline: true },
      { name: "Emoji", value: config.starboardEmoji ?? "?", inline: true },
      { name: "Minimum", value: `${config.starboardMinimum ?? 3}`, inline: true }
    )
    .setFooter({ text: "Hotel Starboard" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleReactionAdd(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  try {
    if (user.bot) return;
    if (reaction.partial) reaction = await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const message = reaction.message;
    const guild = message.guild;
    if (!guild) return;

    const config = await db.query.guildConfigsTable.findFirst({
      where: eq(guildConfigsTable.guildId, guild.id),
    });

    if (!config?.starboardChannelId || !config.starboardEmoji) return;

    // Check if this is the configured emoji
    const emojiKey =
      reaction.emoji.id
        ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
        : (reaction.emoji.name ?? "");

    if (emojiKey !== config.starboardEmoji && reaction.emoji.name !== config.starboardEmoji) return;

    const minimum = config.starboardMinimum ?? 3;
    const count = reaction.count ?? 0;
    if (count < minimum) return;

    // Don't post the same message twice
    const already = await db.query.starboardPostsTable.findFirst({
      where: and(
        eq(starboardPostsTable.messageId, message.id),
        eq(starboardPostsTable.guildId, guild.id)
      ),
    });
    if (already) return;

    const starboardChannel = guild.channels.cache.get(config.starboardChannelId) as TextChannel | undefined;
    if (!starboardChannel) return;

    // Don't post from the starboard channel itself
    if (message.channelId === config.starboardChannelId) return;

    const author = message.author;
    const msgChannel = message.channel as TextChannel;

    const embed = new EmbedBuilder()
      .setColor(HOTEL_GOLD)
      .setAuthor({
        name: author?.username ?? "Onbekend",
        iconURL: author?.displayAvatarURL(),
      })
      .setDescription(message.content || "_Geen tekst_")
      .addFields(
        { name: "Origineel bericht", value: `[Ga naar bericht](${message.url})`, inline: true },
        { name: "Kanaal", value: `<#${message.channelId}>`, inline: true }
      )
      .setTimestamp(message.createdAt);

    // Include first image attachment if present
    const image = message.attachments.find((a) => a.contentType?.startsWith("image/"));
    if (image) embed.setImage(image.url);

    const starMsg = await starboardChannel.send({
      content: `${config.starboardEmoji} **${count}** | <#${message.channelId}>`,
      embeds: [embed],
    });

    // Save to DB so we don't post it again
    await db.insert(starboardPostsTable).values({
      messageId: message.id,
      guildId: guild.id,
      starboardMessageId: starMsg.id,
      postedAt: Date.now(),
    });
  } catch (err) {
    logger.error({ err }, "Starboard reaction handler error");
  }
}
