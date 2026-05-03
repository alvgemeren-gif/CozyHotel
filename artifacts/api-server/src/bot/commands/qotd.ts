import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const qotdCommands = [
  new SlashCommandBuilder()
    .setName("qotd-setup")
    .setDescription("Stel het kanaal in voor de dagelijkse vraag")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("kanaal")
        .setDescription("Het kanaal voor de vraag van de dag")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("qotd-stuur")
    .setDescription("Stuur de vraag van de dag handmatig")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
];
