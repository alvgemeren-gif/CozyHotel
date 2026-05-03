import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../lib/logger";
import { handleInteraction } from "./interactionHandler";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Laat alle beschikbare commands zien"),
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check de bot latency"),
  new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Vertel een grappig grapje"),
  new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Gooi een muntje"),
  new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Vraag de magische 8-ball")
    .addStringOption((opt) =>
      opt.setName("vraag").setDescription("Jouw vraag").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick een gebruiker van de server")
    .addUserOption((opt) =>
      opt.setName("gebruiker").setDescription("De gebruiker om te kicken").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reden").setDescription("Reden voor de kick").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban een gebruiker van de server")
    .addUserOption((opt) =>
      opt.setName("gebruiker").setDescription("De gebruiker om te bannen").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("reden").setDescription("Reden voor de ban").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mute een gebruiker (timeout)")
    .addUserOption((opt) =>
      opt.setName("gebruiker").setDescription("De gebruiker om te muten").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("minuten").setDescription("Aantal minuten (standaard: 10)").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Verwijder de timeout van een gebruiker")
    .addUserOption((opt) =>
      opt.setName("gebruiker").setDescription("De gebruiker om te unmuten").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Verwijder berichten uit het kanaal")
    .addIntegerOption((opt) =>
      opt.setName("aantal").setDescription("Hoeveel berichten (1-100)").setRequired(true)
    ),
];

async function registerCommands(token: string, clientId: string) {
  const rest = new REST().setToken(token);
  try {
    logger.info("Registering slash commands...");
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands.map((c) => c.toJSON()),
    });
    logger.info("Slash commands registered");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
  const token = process.env["DISCORD_BOT_TOKEN"]!;
  registerCommands(token, readyClient.user.id);
});

client.on(Events.InteractionCreate, handleInteraction);

client.on(Events.Error, (err) => {
  logger.error({ err }, "Discord client error");
});

export function startBot() {
  const token = process.env["DISCORD_BOT_TOKEN"];
  if (!token) {
    logger.error("DISCORD_BOT_TOKEN is not set, bot will not start");
    return;
  }
  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to login Discord bot");
  });
}
