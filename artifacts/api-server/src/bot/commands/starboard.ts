import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const starboardCommands = [
  new SlashCommandBuilder()
    .setName("starboard-setup")
    .setDescription("Stel het starboard in: bij genoeg reacties wordt een bericht doorgestuurd")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((opt) =>
      opt.setName("kanaal").setDescription("Kanaal waar berichten naartoe worden geplaatst").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("emoji").setDescription("De emoji die telt (bijv. ⭐ of 🔥)").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("minimum")
        .setDescription("Minimaal aantal reacties (standaard: 3)")
        .setRequired(false)
        .setMinValue(1)
    ),

  new SlashCommandBuilder()
    .setName("starboard-info")
    .setDescription("Bekijk de huidige starboard instellingen"),
];
