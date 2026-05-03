import { Interaction, StringSelectMenuInteraction, ButtonInteraction } from "discord.js";
import { logger } from "../../lib/logger";
import { handleWelkomSetup, handleWelkomTest, handleLeaveSetup } from "./welcomeHandler";
import { handleReviewRecept, handleReviewBoek, handleReviewCategories } from "./reviewHandler";
import { handleRoleMenuMaak, handleRoleMenuRol, handleRoleMenuLijst, handleRoleToggle } from "./roleMenuHandler";
import { handleTellenSetup, handleTellenReset, handleTellenScore } from "./countingHandler";
import { handleBalans, handleWerk, handleSteel, handleGokken, handleRijksten } from "./casinoHandler";
import { handleQotdSetup, handleQotdStuur } from "./qotdHandler";
import { handleAutoroleToevoegen, handleAutoroleVerwijderen, handleAutoroleLijst } from "./autoroleHandler";
import { handleRang, handleRanglijst, handleBeloningToevoegen, handleBeloningLijst } from "./levelHandler";
import {
  handleWordleStart, handleWordleGuess,
  handleMijnenveger,
  handleGalgjeStart, handleGalgjeGuess,
} from "./minigameHandler";

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith("review_categories:")) {
        await handleReviewCategories(interaction as StringSelectMenuInteraction);
      }
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("role_toggle:")) {
        await handleRoleToggle(interaction as ButtonInteraction);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    logger.info({ command: commandName, user: interaction.user.tag }, "Command received");

    switch (commandName) {
      case "welkom-setup": return await handleWelkomSetup(interaction);
      case "welkom-test": return await handleWelkomTest(interaction);
      case "leave-setup": return await handleLeaveSetup(interaction);

      case "review-recept": return await handleReviewRecept(interaction);
      case "review-boek": return await handleReviewBoek(interaction);

      case "role-menu-maak": return await handleRoleMenuMaak(interaction);
      case "role-menu-rol": return await handleRoleMenuRol(interaction);
      case "role-menu-lijst": return await handleRoleMenuLijst(interaction);

      case "tellen-setup": return await handleTellenSetup(interaction);
      case "tellen-reset": return await handleTellenReset(interaction);
      case "tellen-score": return await handleTellenScore(interaction);

      case "balans": return await handleBalans(interaction);
      case "werk": return await handleWerk(interaction);
      case "steel": return await handleSteel(interaction);
      case "gokken": return await handleGokken(interaction);
      case "rijksten": return await handleRijksten(interaction);

      case "qotd-setup": return await handleQotdSetup(interaction);
      case "qotd-stuur": return await handleQotdStuur(interaction);

      case "autorole-toevoegen": return await handleAutoroleToevoegen(interaction);
      case "autorole-verwijderen": return await handleAutoroleVerwijderen(interaction);
      case "autorole-lijst": return await handleAutoroleLijst(interaction);

      case "rang": return await handleRang(interaction);
      case "ranglijst": return await handleRanglijst(interaction);
      case "beloning-toevoegen": return await handleBeloningToevoegen(interaction);
      case "beloning-lijst": return await handleBeloningLijst(interaction);

      case "wordle":
        if (interaction.options.getSubcommand() === "start") return await handleWordleStart(interaction);
        if (interaction.options.getSubcommand() === "raad") return await handleWordleGuess(interaction);
        break;

      case "mijnenveger": return await handleMijnenveger(interaction);

      case "galgje":
        if (interaction.options.getSubcommand() === "start") return await handleGalgjeStart(interaction);
        if (interaction.options.getSubcommand() === "raad") return await handleGalgjeGuess(interaction);
        break;

      default:
        await interaction.reply({ content: "Onbekend command.", ephemeral: true });
    }
  } catch (err) {
    logger.error({ err }, "Interaction handler error");
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Er is een fout opgetreden. Probeer het opnieuw.", ephemeral: true }).catch(() => {});
    }
  }
}
