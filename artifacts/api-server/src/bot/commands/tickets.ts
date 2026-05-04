import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const ticketCommands = [
  new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Plaatst het ticket-menu in een kanaal")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) =>
      opt.setName("kanaal").setDescription("Kanaal voor het ticket-menu").setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName("staff-rol").setDescription("Rol die tickets kan zien en beheren").setRequired(true)
    ),
];
