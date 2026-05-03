import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const roleMenuCommands = [
  new SlashCommandBuilder()
    .setName("role-menu-maak")
    .setDescription("Maak een klikbaar rollen-menu aan in een kanaal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((opt) =>
      opt
        .setName("titel")
        .setDescription("Titel van het rollen-menu")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Beschrijving van het rollen-menu")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("role-menu-rol")
    .setDescription("Voeg een rol toe aan het keuzemenu of verwijder deze")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("De rol om toe te voegen of te verwijderen").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("actie")
        .setDescription("Toevoegen of verwijderen?")
        .setRequired(true)
        .addChoices(
          { name: "Toevoegen", value: "add" },
          { name: "Verwijderen", value: "remove" }
        )
    ),

  new SlashCommandBuilder()
    .setName("role-menu-lijst")
    .setDescription("Bekijk de geconfigureerde rollen in het keuzemenu"),
];
