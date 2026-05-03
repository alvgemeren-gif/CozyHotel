import { ChatInputCommandInteraction, EmbedBuilder, TextChannel, Client } from "discord.js";
import { db } from "@workspace/db";
import { guildConfigsTable } from "@workspace/db";
import { eq, isNotNull } from "drizzle-orm";
import { QUESTIONS } from "../data/questions";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

function todayKey(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getQuestionForToday(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return QUESTIONS[dayOfYear % QUESTIONS.length]!;
}

export async function handleQotdSetup(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("kanaal", true) as TextChannel;

  await db.insert(guildConfigsTable).values({
    guildId: interaction.guildId!,
    qotdChannelId: channel.id,
  }).onConflictDoUpdate({
    target: guildConfigsTable.guildId,
    set: { qotdChannelId: channel.id },
  });

  await interaction.reply({ content: `De vraag van de dag wordt voortaan elke dag om **12:00** gepost in ${channel}. ✅`, ephemeral: true });
}

export async function handleQotdStuur(interaction: ChatInputCommandInteraction) {
  const config = await db.query.guildConfigsTable.findFirst({
    where: eq(guildConfigsTable.guildId, interaction.guildId!),
  });

  if (!config?.qotdChannelId) {
    await interaction.reply({ content: "Stel eerst een QOTD-kanaal in met `/qotd-setup`.", ephemeral: true });
    return;
  }

  const channel = interaction.guild?.channels.cache.get(config.qotdChannelId) as TextChannel | undefined;
  if (!channel) {
    await interaction.reply({ content: "Het ingestelde kanaal is niet gevonden.", ephemeral: true });
    return;
  }

  const question = getQuestionForToday();
  const embed = buildQotdEmbed(question);

  await channel.send({ embeds: [embed] });
  await db.update(guildConfigsTable).set({ qotdLastSent: todayKey() })
    .where(eq(guildConfigsTable.guildId, interaction.guildId!));

  await interaction.reply({ content: `Vraag van de dag gestuurd naar ${channel}! ✅`, ephemeral: true });
}

function buildQotdEmbed(question: string): EmbedBuilder {
  const now = new Date();
  const dateStr = now.toLocaleDateString("nl-NL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🌅 Vraag van de Dag")
    .setDescription(`**${question}**`)
    .addFields({ name: "Datum", value: dateStr, inline: true })
    .setFooter({ text: "Hotel Conversatielounge • Deel jouw antwoord!" })
    .setTimestamp();
}

export async function startQotdScheduler(client: Client) {
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() !== 12 || now.getMinutes() !== 0) return;

    const today = todayKey();
    try {
      const configs = await db.select().from(guildConfigsTable)
        .where(isNotNull(guildConfigsTable.qotdChannelId));

      for (const config of configs) {
        if (config.qotdLastSent === today) continue;
        if (!config.qotdChannelId) continue;

        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) continue;

        const channel = guild.channels.cache.get(config.qotdChannelId) as TextChannel | undefined;
        if (!channel) continue;

        const question = getQuestionForToday();
        await channel.send({ embeds: [buildQotdEmbed(question)] });
        await db.update(guildConfigsTable).set({ qotdLastSent: today })
          .where(eq(guildConfigsTable.guildId, config.guildId));
      }
    } catch (err) {
      logger.error({ err }, "QOTD scheduler error");
    }
  }, 60 * 1000);
}
