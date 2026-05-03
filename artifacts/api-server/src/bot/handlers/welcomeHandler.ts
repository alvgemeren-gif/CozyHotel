import { ChatInputCommandInteraction, GuildMember, EmbedBuilder, TextChannel } from "discord.js";
import { db } from "@workspace/db";
import { guildConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

export async function handleWelkomSetup(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("kanaal", true) as TextChannel;
  const bericht = interaction.options.getString("bericht") ??
    "Welkom in **{server}**, {user}! Wij zijn verheugd u te mogen verwelkomen als onze nieuwste gast. Wij hopen dat uw verblijf aangenaam zal zijn. 🏨✨";

  await db.insert(guildConfigsTable).values({
    guildId: interaction.guildId!,
    welcomeChannelId: channel.id,
    welcomeMessage: bericht,
  }).onConflictDoUpdate({
    target: guildConfigsTable.guildId,
    set: { welcomeChannelId: channel.id, welcomeMessage: bericht },
  });

  await interaction.reply({ content: `Het welkomstkanaal is ingesteld op ${channel}. ✅`, ephemeral: true });
}

export async function handleWelkomTest(interaction: ChatInputCommandInteraction) {
  const config = await db.query.guildConfigsTable.findFirst({
    where: eq(guildConfigsTable.guildId, interaction.guildId!),
  });

  if (!config?.welcomeChannelId) {
    await interaction.reply({ content: "Er is geen welkomstkanaal ingesteld. Gebruik eerst `/welkom-setup`.", ephemeral: true });
    return;
  }

  const channel = interaction.guild?.channels.cache.get(config.welcomeChannelId) as TextChannel | undefined;
  if (!channel) {
    await interaction.reply({ content: "Het ingestelde kanaal is niet gevonden.", ephemeral: true });
    return;
  }

  const msg = (config.welcomeMessage ?? "Welkom in **{server}**, {user}! 🏨")
    .replace("{user}", interaction.user.toString())
    .replace("{server}", interaction.guild?.name ?? "");

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🏨 Welkom in ons Hotel")
    .setDescription(msg)
    .setThumbnail(interaction.user.displayAvatarURL())
    .setFooter({ text: "Hotel Concierge" })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  await interaction.reply({ content: `Testwelkomstbericht gestuurd naar ${channel}.`, ephemeral: true });
}

export async function handleLeaveSetup(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("kanaal", true) as TextChannel;
  const bericht = interaction.options.getString("bericht") ??
    "**{user}** heeft ons hotel verlaten. Wij hopen u spoedig terug te mogen begroeten. Tot ziens! 🛎️";

  await db.insert(guildConfigsTable).values({
    guildId: interaction.guildId!,
    leaveChannelId: channel.id,
    leaveMessage: bericht,
  }).onConflictDoUpdate({
    target: guildConfigsTable.guildId,
    set: { leaveChannelId: channel.id, leaveMessage: bericht },
  });

  await interaction.reply({ content: `Het vertrekkanaal is ingesteld op ${channel}. ✅`, ephemeral: true });
}

export async function onMemberJoin(member: GuildMember) {
  try {
    const config = await db.query.guildConfigsTable.findFirst({
      where: eq(guildConfigsTable.guildId, member.guild.id),
    });
    if (!config?.welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(config.welcomeChannelId) as TextChannel | undefined;
    if (!channel) return;

    const msg = (config.welcomeMessage ?? "Welkom in **{server}**, {user}! 🏨")
      .replace("{user}", member.toString())
      .replace("{server}", member.guild.name);

    const embed = new EmbedBuilder()
      .setColor(HOTEL_GOLD)
      .setTitle("🏨 Een nieuwe gast is gearriveerd")
      .setDescription(msg)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields({ name: "Lid nummer", value: `${member.guild.memberCount}`, inline: true })
      .setFooter({ text: "Hotel Concierge • Welkom!" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error({ err }, "Error sending welcome message");
  }
}

export async function onMemberLeave(member: GuildMember) {
  try {
    const config = await db.query.guildConfigsTable.findFirst({
      where: eq(guildConfigsTable.guildId, member.guild.id),
    });
    if (!config?.leaveChannelId) return;

    const channel = member.guild.channels.cache.get(config.leaveChannelId) as TextChannel | undefined;
    if (!channel) return;

    const msg = (config.leaveMessage ?? "**{user}** heeft ons verlaten. 🛎️")
      .replace("{user}", member.user.tag)
      .replace("{server}", member.guild.name);

    const embed = new EmbedBuilder()
      .setColor(0x8B0000)
      .setTitle("🛎️ Een gast heeft uitgecheckt")
      .setDescription(msg)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: "Hotel Concierge • Tot ziens" })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error({ err }, "Error sending leave message");
  }
}
