import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const autoroleCommands = [
  new SlashCommandBuilder()
    .setName("autorole-toevoegen")
    .setDescription("Voeg een rol toe die iedereen krijgt bij binnenkomst")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("De rol om automatisch toe te wijzen").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("autorole-verwijderen")
    .setDescription("Verwijder een autorole")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("De rol om te verwijderen uit de autoroles").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("autorole-lijst")
    .setDescription("Bekijk alle geconfigureerde autoroles"),
];
