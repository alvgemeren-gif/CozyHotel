import { GuildMember, TextChannel } from "discord.js";
import { logger } from "../lib/logger";

export async function handleGuildMemberAdd(member: GuildMember) {
  logger.info({ user: member.user.tag, guild: member.guild.name }, "New member joined");

  const welcomeChannelName = "welkom";
  const generalChannelName = "general";

  const channel =
    member.guild.channels.cache.find(
      (ch) =>
        ch.isTextBased() &&
        (ch.name === welcomeChannelName || ch.name === generalChannelName)
    ) as TextChannel | undefined;

  if (!channel) {
    logger.warn({ guild: member.guild.name }, "No welcome/general channel found");
    return;
  }

  await channel.send(
    `Welkom op **${member.guild.name}**, ${member}! 🎉\n` +
    `We zijn blij dat je er bent. Gebruik \`!help\` om te zien wat de bot kan doen.\n` +
    `Je bent lid nummer **${member.guild.memberCount}**!`
  );
}
