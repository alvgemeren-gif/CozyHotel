import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const countingCommands = [
  new SlashCommandBuilder()
    .setName("tellen-setup")
    .setDescription("Stel het telkanaal in")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) =>
      opt
        .setName("kanaal")
        .setDescription("Het kanaal waar geteld wordt")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("tellen-reset")
    .setDescription("Reset de teller naar nul")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("tellen-score")
    .setDescription("Bekijk de huidige telling en highscore"),
];
