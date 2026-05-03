import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const roleMenuCommands = [
  new SlashCommandBuilder()
    .setName("rollen-menu")
    .setDescription("Maak een rollenmenu met alle serverrollen — leden kunnen zelf kiezen")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((opt) =>
      opt.setName("titel").setDescription("Titel van het rollenmenu").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Beschrijving onder de titel")
        .setRequired(false)
    ),
];
