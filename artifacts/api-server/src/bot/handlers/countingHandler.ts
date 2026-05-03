import { ChatInputCommandInteraction, EmbedBuilder, Message, TextChannel } from "discord.js";
import { db } from "@workspace/db";
import { guildConfigsTable, countingTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

export async function handleTellenSetup(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("kanaal", true) as TextChannel;

  await db.insert(guildConfigsTable).values({
    guildId: interaction.guildId!,
    countingChannelId: channel.id,
  }).onConflictDoUpdate({
    target: guildConfigsTable.guildId,
    set: { countingChannelId: channel.id },
  });

  await db.insert(countingTable).values({ guildId: interaction.guildId!, count: 0 })
    .onConflictDoNothing();

  await interaction.reply({ content: `Het telkanaal is ingesteld op ${channel}. Begin met tellen bij **1**! 🔢`, ephemeral: true });
}

export async function handleTellenReset(interaction: ChatInputCommandInteraction) {
  await db.insert(countingTable).values({ guildId: interaction.guildId!, count: 0 })
    .onConflictDoUpdate({
      target: countingTable.guildId,
      set: { count: 0, lastUserId: null },
    });

  await interaction.reply({ content: `De teller is gereset naar **0**. Begin opnieuw met **1**! 🔄`, ephemeral: true });
}

export async function handleTellenScore(interaction: ChatInputCommandInteraction) {
  const counting = await db.query.countingTable.findFirst({
    where: eq(countingTable.guildId, interaction.guildId!),
  });

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🔢 Telsysteem")
    .addFields(
      { name: "Huidige telling", value: `${counting?.count ?? 0}`, inline: true },
      { name: "Hoogste score", value: `${counting?.highScore ?? 0}`, inline: true }
    )
    .setFooter({ text: "Hotel Telsysteem" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleCountingMessage(message: Message) {
  if (!message.guild || message.author.bot) return;

  try {
    const config = await db.query.guildConfigsTable.findFirst({
      where: eq(guildConfigsTable.guildId, message.guild.id),
    });
    if (!config?.countingChannelId || config.countingChannelId !== message.channelId) return;

    const num = parseInt(message.content.trim(), 10);
    if (isNaN(num)) {
      await message.delete().catch(() => {});
      return;
    }

    const counting = await db.query.countingTable.findFirst({
      where: eq(countingTable.guildId, message.guild.id),
    });

    const expected = (counting?.count ?? 0) + 1;

    if (counting?.lastUserId === message.author.id) {
      await message.react("❌").catch(() => {});
      const warn = await message.channel.send(
        `${message.author} Dezelfde persoon mag niet twee keer achter elkaar tellen! De teller reset naar **0**. 🔄`
      );
      await db.update(countingTable).set({ count: 0, lastUserId: null })
        .where(eq(countingTable.guildId, message.guild.id));
      return;
    }

    if (num !== expected) {
      await message.react("❌").catch(() => {});
      await message.channel.send(
        `${message.author} heeft **${num}** gezegd, maar **${expected}** was verwacht! De teller reset naar **0**. 💥\nBegin opnieuw met **1**!`
      );
      await db.update(countingTable).set({ count: 0, lastUserId: null })
        .where(eq(countingTable.guildId, message.guild.id));
    } else {
      await message.react("✅").catch(() => {});
      const newHighScore = Math.max(num, counting?.highScore ?? 0);
      await db.update(countingTable).set({ count: num, lastUserId: message.author.id, highScore: newHighScore })
        .where(eq(countingTable.guildId, message.guild.id));
    }
  } catch (err) {
    logger.error({ err }, "Counting handler error");
  }
}
