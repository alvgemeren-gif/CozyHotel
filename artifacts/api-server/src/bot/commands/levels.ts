import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const levelCommands = [
  new SlashCommandBuilder()
    .setName("rang")
    .setDescription("Bekijk jouw hotelrang en XP")
    .addUserOption((opt) =>
      opt.setName("gebruiker").setDescription("Bekijk iemand anders zijn rang").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("ranglijst")
    .setDescription("Bekijk de top 10 meest actieve hotelgasten"),

  new SlashCommandBuilder()
    .setName("level-up-setup")
    .setDescription("Stel het kanaal in voor level-up berichten")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) =>
      opt.setName("kanaal").setDescription("Kanaal voor level-up berichten").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("level-beloningen-wissen")
    .setDescription("Wis alle level-up beloningsrollen")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("beloning-toevoegen")
    .setDescription("Koppel een rol aan een level als beloning")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addIntegerOption((opt) =>
      opt
        .setName("level")
        .setDescription("Bij welk level wordt de rol toegewezen?")
        .setRequired(true)
        .setMinValue(1)
    )
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("De beloningsrol").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("beloning-lijst")
    .setDescription("Bekijk alle levelbeloningen"),

  new SlashCommandBuilder()
    .setName("beloning-verwijderen")
    .setDescription("Verwijder een levelbeloning")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addIntegerOption((opt) =>
      opt
        .setName("level")
        .setDescription("Het level waarvan je de beloning wil verwijderen")
        .setRequired(true)
        .setMinValue(1)
    )
    .addRoleOption((opt) =>
      opt.setName("rol").setDescription("De beloningsrol om te verwijderen").setRequired(true)
    ),
];
