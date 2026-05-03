import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const welcomeCommands = [
  new SlashCommandBuilder()
    .setName("welkom-setup")
    .setDescription("Stel het welkomstkanaal en welkomstbericht in")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("kanaal")
        .setDescription("Het kanaal voor welkomstberichten")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("bericht")
        .setDescription("Welkomstbericht ({user} = de nieuwe gast, {server} = servernaam)")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("welkom-test")
    .setDescription("Test het welkomstbericht")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("leave-setup")
    .setDescription("Stel het vertrek-kanaal en vertrekbericht in")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("kanaal")
        .setDescription("Het kanaal voor vertrekberichten")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("bericht")
        .setDescription("Vertrekbericht ({user} = naam, {server} = servernaam)")
        .setRequired(false)
    ),
];
