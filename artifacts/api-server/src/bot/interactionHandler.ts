import {
  Interaction,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { logger } from "../lib/logger";

const jokes = [
  "Waarom kunnen programmeurs niet slapen? Omdat ze bugs in hun hoofd hebben!",
  "Wat zegt een nul tegen een acht? Leuke riem!",
  "Waarom ging de wiskundige naar het strand? Om de pi te zien!",
  "Hoe noem je een beer zonder tanden? Een tandenbeer!",
  "Wat is het verschil tussen een piano en een vis? Je kunt een piano intoneren, maar een vis kun je niet tunen!",
  "Waarom is 6 bang voor 7? Omdat 7, 8, 9!",
  "Wat is groen en staat in de hoek? Een stout boompje!",
  "Waarom gaat een koe naar de kapper? Voor een mooi staartkapsel!",
];

const eightBallResponses = [
  "Ja, zeker weten!",
  "Nee, absoluut niet.",
  "Misschien wel...",
  "Vraag het later nog eens.",
  "De tekenen wijzen op ja.",
  "Mijn antwoord is nee.",
  "Ik twijfel eraan.",
  "Concentreer je en vraag opnieuw.",
  "De vooruitzichten zien er goed uit!",
  "Dat lijkt me niet.",
];

export async function handleInteraction(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  logger.info({ command: commandName, user: interaction.user.tag }, "Slash command received");

  switch (commandName) {
    case "help":
      await interaction.reply({
        content:
          "**Beschikbare commands:**\n" +
          "`/help` — Laat dit bericht zien\n" +
          "`/ping` — Check de bot latency\n" +
          "`/joke` — Vertel een grapje\n" +
          "`/coinflip` — Gooi een muntje\n" +
          "`/8ball <vraag>` — Vraag de magische 8-ball\n" +
          "\n**Moderatie (alleen voor mods):**\n" +
          "`/kick <gebruiker> [reden]` — Kick een gebruiker\n" +
          "`/ban <gebruiker> [reden]` — Ban een gebruiker\n" +
          "`/mute <gebruiker> [minuten]` — Mute een gebruiker (timeout)\n" +
          "`/unmute <gebruiker>` — Verwijder timeout\n" +
          "`/clear <aantal>` — Verwijder berichten",
        ephemeral: true,
      });
      break;

    case "ping":
      await interaction.reply(`Pong! Latency: ${interaction.client.ws.ping}ms`);
      break;

    case "joke":
      await interaction.reply(jokes[Math.floor(Math.random() * jokes.length)]!);
      break;

    case "coinflip":
      await interaction.reply(Math.random() < 0.5 ? "🪙 **Hoofd!**" : "🪙 **Munt!**");
      break;

    case "8ball": {
      const vraag = interaction.options.getString("vraag", true);
      const response = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
      await interaction.reply(`🎱 **${response}**\n> ${vraag}`);
      break;
    }

    case "kick": {
      if (!interaction.guild) { await interaction.reply({ content: "Alleen op servers.", ephemeral: true }); break; }
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
        await interaction.reply({ content: "Je hebt geen kick-permissie.", ephemeral: true });
        break;
      }
      const user = interaction.options.getUser("gebruiker", true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member || !member.kickable) {
        await interaction.reply({ content: "Ik kan deze gebruiker niet kicken.", ephemeral: true });
        break;
      }
      const reden = interaction.options.getString("reden") ?? "Geen reden opgegeven";
      await member.kick(reden);
      await interaction.reply(`✅ **${user.tag}** is gekicked. Reden: ${reden}`);
      break;
    }

    case "ban": {
      if (!interaction.guild) { await interaction.reply({ content: "Alleen op servers.", ephemeral: true }); break; }
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
        await interaction.reply({ content: "Je hebt geen ban-permissie.", ephemeral: true });
        break;
      }
      const user = interaction.options.getUser("gebruiker", true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member || !member.bannable) {
        await interaction.reply({ content: "Ik kan deze gebruiker niet bannen.", ephemeral: true });
        break;
      }
      const reden = interaction.options.getString("reden") ?? "Geen reden opgegeven";
      await member.ban({ reason: reden });
      await interaction.reply(`🔨 **${user.tag}** is gebanned. Reden: ${reden}`);
      break;
    }

    case "mute": {
      if (!interaction.guild) { await interaction.reply({ content: "Alleen op servers.", ephemeral: true }); break; }
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: "Je hebt geen mute-permissie.", ephemeral: true });
        break;
      }
      const user = interaction.options.getUser("gebruiker", true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: "Gebruiker niet gevonden.", ephemeral: true });
        break;
      }
      const minutes = interaction.options.getInteger("minuten") ?? 10;
      const duration = Math.min(Math.max(minutes, 1), 40320);
      await member.timeout(duration * 60 * 1000, "Gemuted via bot");
      await interaction.reply(`🔇 **${user.tag}** is gemuted voor ${duration} minuten.`);
      break;
    }

    case "unmute": {
      if (!interaction.guild) { await interaction.reply({ content: "Alleen op servers.", ephemeral: true }); break; }
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
        await interaction.reply({ content: "Je hebt geen unmute-permissie.", ephemeral: true });
        break;
      }
      const user = interaction.options.getUser("gebruiker", true);
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: "Gebruiker niet gevonden.", ephemeral: true });
        break;
      }
      await member.timeout(null);
      await interaction.reply(`🔊 **${user.tag}** is geunmuted.`);
      break;
    }

    case "clear": {
      if (!interaction.guild || !interaction.channel) {
        await interaction.reply({ content: "Kan hier geen berichten verwijderen.", ephemeral: true });
        break;
      }
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "Je hebt geen permissie om berichten te verwijderen.", ephemeral: true });
        break;
      }
      const aantal = interaction.options.getInteger("aantal", true);
      if (aantal < 1 || aantal > 100) {
        await interaction.reply({ content: "Geef een getal tussen 1 en 100.", ephemeral: true });
        break;
      }
      const channel = interaction.channel as TextChannel;
      if ("bulkDelete" in channel) {
        await interaction.deferReply({ ephemeral: true });
        await channel.bulkDelete(aantal, true);
        await interaction.editReply(`🗑️ ${aantal} berichten verwijderd.`);
      }
      break;
    }

    default:
      await interaction.reply({ content: "Onbekend command.", ephemeral: true });
      break;
  }
}
