import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, Message } from "discord.js";
import { db } from "@workspace/db";
import { levelsTable, levelRewardsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;
const XP_COOLDOWN = 60 * 1000;

export function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50));
}

export function xpForLevel(level: number): number {
  return level * level * 50;
}

async function getOrCreate(userId: string, guildId: string, username: string) {
  const existing = await db.query.levelsTable.findFirst({
    where: and(eq(levelsTable.userId, userId), eq(levelsTable.guildId, guildId)),
  });
  if (existing) return existing;
  const [created] = await db.insert(levelsTable).values({ userId, guildId, username, xp: 0, level: 0 }).returning();
  return created!;
}

const HOTEL_RANKS = [
  "Hotelbezoeker", "Vaste Gast", "Stamgast", "Platina Gast", "VIP Gast",
  "Elite Gast", "Ambassadeur", "Gouden Lid", "Diamanten Lid", "Grand Master",
];

export function getRankTitle(level: number): string {
  const idx = Math.min(Math.floor(level / 5), HOTEL_RANKS.length - 1);
  return HOTEL_RANKS[idx]!;
}

export async function handleMessageXP(message: Message) {
  if (!message.guild || message.author.bot) return;
  try {
    const entry = await getOrCreate(message.author.id, message.guild.id, message.author.username);
    const now = Date.now();
    if (entry.lastXpGain && now - entry.lastXpGain < XP_COOLDOWN) return;

    const gained = Math.floor(Math.random() * 25) + 15;
    const newXp = entry.xp + gained;
    const oldLevel = entry.level;
    const newLevel = calcLevel(newXp);

    await db.update(levelsTable)
      .set({ xp: newXp, level: newLevel, username: message.author.username, lastXpGain: now })
      .where(and(eq(levelsTable.userId, message.author.id), eq(levelsTable.guildId, message.guild.id)));

    if (newLevel > oldLevel) {
      const embed = new EmbedBuilder()
        .setColor(HOTEL_GOLD)
        .setTitle("🌟 Level Up!")
        .setDescription(`${message.author} is opgeklommen naar **Level ${newLevel}** — ${getRankTitle(newLevel)}!\nWelkom op de volgende verdieping van het hotel! 🏨`)
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();
      await message.channel.send({ embeds: [embed] });

      const rewards = await db.query.levelRewardsTable.findMany({
        where: and(
          eq(levelRewardsTable.guildId, message.guild.id),
          eq(levelRewardsTable.level, newLevel)
        ),
      });

      for (const reward of rewards) {
        const role = message.guild.roles.cache.get(reward.roleId);
        if (role) {
          const member = message.member as GuildMember;
          await member.roles.add(role).catch(() => {});
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "XP handler error");
  }
}

export async function handleRang(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("gebruiker") ?? interaction.user;
  const entry = await getOrCreate(target.id, interaction.guildId!, target.username);

  const currentLevel = calcLevel(entry.xp);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const currentLevelXp = xpForLevel(currentLevel);
  const progress = entry.xp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  const barFilled = Math.round((progress / needed) * 20);
  const progressBar = "█".repeat(barFilled) + "░".repeat(20 - barFilled);

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🏅 Hotelrang")
    .setDescription(`Rang van **${target.username}**`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      { name: "Level", value: `${currentLevel}`, inline: true },
      { name: "Rang", value: getRankTitle(currentLevel), inline: true },
      { name: "Totale XP", value: `${entry.xp.toLocaleString()}`, inline: true },
      { name: `Voortgang naar Level ${currentLevel + 1}`, value: `\`${progressBar}\` ${progress}/${needed} XP` }
    )
    .setFooter({ text: "Hotel Level Systeem" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleRanglijst(interaction: ChatInputCommandInteraction) {
  const top = await db.select().from(levelsTable)
    .where(eq(levelsTable.guildId, interaction.guildId!))
    .orderBy(desc(levelsTable.xp))
    .limit(10);

  const lines = await Promise.all(
    top.map(async (e, i) => {
      const user = await interaction.client.users.fetch(e.userId).catch(() => null);
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      return `${medal} **${user?.username ?? e.username}** — Level ${e.level} (${e.xp.toLocaleString()} XP) — ${getRankTitle(e.level)}`;
    })
  );

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🏆 Hotel Activiteitenranglijst")
    .setDescription(lines.join("\n") || "Nog niemand heeft XP verdiend.")
    .setFooter({ text: "Hotel Level Systeem" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleBeloningToevoegen(interaction: ChatInputCommandInteraction) {
  const level = interaction.options.getInteger("level", true);
  const role = interaction.options.getRole("rol", true);

  await db.insert(levelRewardsTable).values({
    guildId: interaction.guildId!,
    level,
    roleId: role.id,
    roleName: role.name,
  });

  await interaction.reply({ content: `✅ Op Level **${level}** wordt de rol **${role.name}** toegewezen.`, ephemeral: true });
}

export async function handleBeloningLijst(interaction: ChatInputCommandInteraction) {
  const rewards = await db.query.levelRewardsTable.findMany({
    where: eq(levelRewardsTable.guildId, interaction.guildId!),
  });

  rewards.sort((a, b) => a.level - b.level);

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🎁 Levelbeloningen")
    .setDescription(
      rewards.length
        ? rewards.map(r => `Level **${r.level}** → @${r.roleName}`).join("\n")
        : "Er zijn nog geen beloningen ingesteld."
    )
    .setFooter({ text: "Hotel Level Systeem" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
