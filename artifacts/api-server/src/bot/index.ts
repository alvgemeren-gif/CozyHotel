import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../lib/logger";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

async function clearCommands(token: string, clientId: string) {
  const rest = new REST().setToken(token);
  try {
    logger.info("Clearing all slash commands...");
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    logger.info("All slash commands cleared");
  } catch (err) {
    logger.error({ err }, "Failed to clear slash commands");
  }
}

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord bot is online");
  const token = process.env["DISCORD_BOT_TOKEN"]!;
  clearCommands(token, readyClient.user.id);
});

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
