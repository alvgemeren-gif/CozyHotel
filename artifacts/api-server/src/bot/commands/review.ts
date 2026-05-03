import { SlashCommandBuilder } from "discord.js";

export const RECIPE_CATEGORIES = [
  { label: "🌅 Ontbijt", value: "ontbijt" },
  { label: "☀️ Lunch", value: "lunch" },
  { label: "🌙 Avondeten", value: "avondeten" },
  { label: "🍝 Pasta", value: "pasta" },
  { label: "🥗 Salade", value: "salade" },
  { label: "🍕 Pizza", value: "pizza" },
  { label: "🍲 Soep", value: "soep" },
  { label: "🥩 Vlees", value: "vlees" },
  { label: "🐟 Vis & Zeevruchten", value: "vis" },
  { label: "🥦 Vegetarisch", value: "vegetarisch" },
  { label: "🌱 Veganistisch", value: "veganistisch" },
  { label: "🍞 Bakken", value: "bakken" },
  { label: "🍰 Dessert", value: "dessert" },
  { label: "🥐 Voorgerecht", value: "voorgerecht" },
  { label: "🍱 Snack", value: "snack" },
  { label: "🍜 Aziatisch", value: "aziatisch" },
  { label: "🥘 Mediterraans", value: "mediterraans" },
  { label: "🌮 Mexicaans", value: "mexicaans" },
  { label: "🇮🇹 Italiaans", value: "italiaans" },
  { label: "🇳🇱 Nederlands", value: "nederlands" },
  { label: "🔥 BBQ", value: "bbq" },
  { label: "⚡ Snel klaar", value: "snel_klaar" },
  { label: "🎉 Feestelijk", value: "feestelijk" },
  { label: "💚 Gezond", value: "gezond" },
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
        .setDescription("Beoordeling (1-5 sterren)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Korte beschrijving van het recept")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("review-drank")
    .setDescription("Review een drankje — cocktail, wijn, sap, etc.")
    .addStringOption((opt) =>
      opt.setName("naam").setDescription("Naam van het drankje").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("soort")
        .setDescription("Soort drank")
        .setRequired(true)
        .addChoices(
          { name: "🍸 Cocktail", value: "Cocktail" },
          { name: "🍷 Wijn", value: "Wijn" },
          { name: "🍺 Bier", value: "Bier" },
          { name: "🥂 Champagne / Prosecco", value: "Champagne" },
          { name: "🫖 Thee", value: "Thee" },
          { name: "☕ Koffie", value: "Koffie" },
          { name: "🧃 Sap / Smoothie", value: "Sap" },
          { name: "🥤 Frisdrank", value: "Frisdrank" },
          { name: "💧 Water", value: "Water" },
          { name: "🍹 Anders", value: "Anders" }
        )
    )
    .addIntegerOption((opt) =>
      opt
        .setName("rating")
        .setDescription("Beoordeling (1-5 sterren)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption((opt) =>
      opt.setName("beschrijving").setDescription("Korte omschrijving of smaaknotitie").setRequired(false)
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
        .setDescription("Beoordeling (1-5 sterren)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Korte recensie of gedachten over het boek")
        .setRequired(false)
    ),
];
