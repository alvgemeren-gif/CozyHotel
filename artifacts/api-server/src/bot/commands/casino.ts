import { SlashCommandBuilder } from "discord.js";

export const casinoCommands = [
  new SlashCommandBuilder()
    .setName("balans")
    .setDescription("Bekijk jouw hotelkluissaldo")
    .addUserOption((opt) =>
      opt.setName("gebruiker").setDescription("Bekijk iemand anders zijn balans").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("werk")
    .setDescription("Verdien munten door te werken in het hotel (30 minuten cooldown)"),

  new SlashCommandBuilder()
    .setName("steel")
    .setDescription("Probeer munten te stelen van een andere gast (50% kans)")
    .addUserOption((opt) =>
      opt.setName("slachtoffer").setDescription("De gast om van te stelen").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("gokken")
    .setDescription("Gooi de gokautomaat in de hotelcasino")
    .addIntegerOption((opt) =>
      opt
        .setName("inzet")
        .setDescription("Hoeveel munten wil je inzetten?")
        .setRequired(true)
        .setMinValue(10)
    ),

  new SlashCommandBuilder()
    .setName("rijksten")
    .setDescription("Bekijk de rijkste gasten van het hotel"),
];
