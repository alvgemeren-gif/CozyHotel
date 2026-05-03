import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../lib/logger";
import { handleInteraction } from "./handlers/interactionHandler";
import { handleCountingMessage } from "./handlers/countingHandler";
import { handleMessageXP } from "./handlers/levelHandler";
import { onMemberJoin, onMemberLeave } from "./handlers/welcomeHandler";
import { applyAutoroles } from "./handlers/autoroleHandler";
import { startQotdScheduler } from "./handlers/qotdHandler";
import { welcomeCommands } from "./commands/welcome";
import { reviewCommands } from "./commands/review";
import { roleMenuCommands } from "./commands/roleMenu";
import { countingCommands } from "./commands/counting";
import { casinoCommands } from "./commands/casino";
import { qotdCommands } from "./commands/qotd";
import { autoroleCommands } from "./commands/autoroles";
import { levelCommands } from "./commands/levels";
import { minigameCommands } from "./commands/minigames";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,   // Vereist: zet "Server Members Intent" aan in Developer Portal
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Vereist: zet "Message Content Intent" aan in Developer Portal
  ],
});

const allCommands = [
  ...welcomeCommands,
  ...reviewCommands,
  ...roleMenuCommands,
  ...countingCommands,
  ...casinoCommands,
  ...qotdCommands,
  ...autoroleCommands,
  ...levelCommands,
  ...minigameCommands,
];

async function registerCommands(token: string, clientId: string) {
  const rest = new REST().setToken(token);
  try {
    logger.info(`Registering ${allCommands.length} slash commands...`);
    await rest.put(Routes.applicationCommands(clientId), {
      body: allCommands.map((c) => c.toJSON()),
    });
    logger.info("All slash commands registered");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Hotel Discord Bot is online");
  const token = process.env["DISCORD_BOT_TOKEN"]!;
  registerCommands(token, readyClient.user.id);
  startQotdScheduler(readyClient);
});

client.on(Events.InteractionCreate, handleInteraction);

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  await handleCountingMessage(message);
  await handleMessageXP(message);
});

client.on(Events.GuildMemberAdd, async (member) => {
  await onMemberJoin(member);
  await applyAutoroles(member);
});

client.on(Events.GuildMemberRemove, async (member) => {
  if (member.partial) return;
  await onMemberLeave(member as import("discord.js").GuildMember);
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
