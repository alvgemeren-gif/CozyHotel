import { SlashCommandBuilder } from "discord.js";

export const RECIPE_CATEGORIES = [
  { label: "Voorgerecht", value: "voorgerecht" },
  { label: "Hoofdgerecht", value: "hoofdgerecht" },
  { label: "Dessert", value: "dessert" },
  { label: "Ontbijt", value: "ontbijt" },
  { label: "Lunch", value: "lunch" },
  { label: "Snack", value: "snack" },
  { label: "Vegetarisch", value: "vegetarisch" },
  { label: "Veganistisch", value: "veganistisch" },
  { label: "Glutenvrij", value: "glutenvrij" },
  { label: "Mediterraans", value: "mediterraans" },
  { label: "Aziatisch", value: "aziatisch" },
  { label: "Italiaans", value: "italiaans" },
  { label: "Frans", value: "frans" },
  { label: "Mexicaans", value: "mexicaans" },
  { label: "Nederands", value: "nederlands" },
  { label: "Snel klaar", value: "snel_klaar" },
  { label: "Feestelijk", value: "feestelijk" },
  { label: "BBQ", value: "bbq" },
  { label: "Soep", value: "soep" },
  { label: "Bakken", value: "bakken" },
  { label: "Drank", value: "drank" },
  { label: "Comfort food", value: "comfort_food" },
  { label: "Gezond", value: "gezond" },
  { label: "Kindvriendelijk", value: "kindvriendelijk" },
  { label: "Zeevruchten", value: "zeevruchten" },
];

export const reviewCommands = [
  new SlashCommandBuilder()
    .setName("review-recept")
    .setDescription("Review een recept met link en categorieen")
    .addStringOption((opt) =>
      opt.setName("titel").setDescription("Naam van het recept").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("link").setDescription("Link naar het recept").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("rating")
        .setDescription("Beoordeling (1-10)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Korte beschrijving van het recept")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("review-boek")
    .setDescription("Review een boek")
    .addStringOption((opt) =>
      opt.setName("titel").setDescription("Titel van het boek").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("schrijver").setDescription("Naam van de schrijver").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt
        .setName("rating")
        .setDescription("Beoordeling (1-10)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Korte recensie of gedachten over het boek")
        .setRequired(false)
    ),
];
