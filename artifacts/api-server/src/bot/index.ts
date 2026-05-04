import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
} from "discord.js";
import { logger } from "../lib/logger";
import { handleInteraction } from "./handlers/interactionHandler";
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
import { ticketCommands } from "./commands/tickets";
import { embedCommands } from "./commands/embeds";
import { starboardCommands } from "./commands/starboard";
import { handleReactionAdd } from "./handlers/starboardHandler";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
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
  ...ticketCommands,
  ...embedCommands,
  ...starboardCommands,
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
  enablePrivilegedFeatures();
});

client.on(Events.InteractionCreate, handleInteraction);

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  await handleReactionAdd(reaction, user);
});

client.on(Events.Error, (err) => {
  logger.error({ err }, "Discord client error");
});

export function startBot() {
  const token = process.env["DISCORD_BOT_TOKEN"];

  if (!token) {
    console.error("DISCORD_BOT_TOKEN missing");
    return;
  }

  console.log("LOGIN START");

  // 🧠 BOT READY EVENT (belangrijk)
  client.once(Events.ClientReady, (readyClient) => {
    console.log("BOT READY:", readyClient.user.tag);
  });

  // 🧠 GLOBAL ERROR HANDLING (crashes zichtbaar maken)
  client.on("error", (err) => {
    console.error("DISCORD CLIENT ERROR:", err);
  });

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION:", err);
  });

  process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err);
  });

  // 🚀 LOGIN
  client.login(token)
    .then(() => console.log("LOGIN OK"))
    .catch((err) => console.error("LOGIN FAILED:", err));
}
export function enablePrivilegedFeatures() {
  const { handleCountingMessage } = require("./handlers/countingHandler");
  const { handleMessageXP } = require("./handlers/levelHandler");
  const { onMemberJoin, onMemberLeave } = require("./handlers/welcomeHandler");
  const { applyAutoroles } = require("./handlers/autoroleHandler");

  client.on(Events.MessageCreate, async (message: import("discord.js").Message) => {
    if (message.author.bot) return;
    await handleCountingMessage(message);
    await handleMessageXP(message);
  });

  client.on(Events.GuildMemberAdd, async (member: import("discord.js").GuildMember) => {
    await onMemberJoin(member);
    await applyAutoroles(member);
  });

  client.on(Events.GuildMemberRemove, async (member: import("discord.js").GuildMember | import("discord.js").PartialGuildMember) => {
    if (member.partial) return;
    await onMemberLeave(member as import("discord.js").GuildMember);
  });

  logger.info("Privileged features enabled (counting, XP, welcome/leave, autoroles)");
}
