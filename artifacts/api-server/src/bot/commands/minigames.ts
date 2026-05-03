import { SlashCommandBuilder } from "discord.js";

export const minigameCommands = [
  new SlashCommandBuilder()
    .setName("wordle")
    .setDescription("Speel Wordle — raad het 5-letterwoord")
    .addSubcommand((sub) =>
      sub.setName("start").setDescription("Start een nieuw Wordle-spel")
    )
    .addSubcommand((sub) =>
      sub
        .setName("raad")
        .setDescription("Doe een gok")
        .addStringOption((opt) =>
          opt
            .setName("woord")
            .setDescription("Een 5-letter Nederlands woord")
            .setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName("mijnenveger")
    .setDescription("Speel Mijnenveger")
    .addStringOption((opt) =>
      opt
        .setName("moeilijkheid")
        .setDescription("Kies een moeilijkheidsgraad")
        .setRequired(false)
        .addChoices(
          { name: "Makkelijk (5x5, 3 mijnen)", value: "easy" },
          { name: "Normaal (7x7, 8 mijnen)", value: "medium" },
          { name: "Moeilijk (9x9, 15 mijnen)", value: "hard" }
        )
    ),

  new SlashCommandBuilder()
    .setName("galgje")
    .setDescription("Speel Galgje — raad het woord")
    .addSubcommand((sub) =>
      sub.setName("start").setDescription("Start een nieuw potje Galgje")
    )
    .addSubcommand((sub) =>
      sub
        .setName("raad")
        .setDescription("Raad een letter of het hele woord")
        .addStringOption((opt) =>
          opt
            .setName("letter")
            .setDescription("Een letter of het volledige woord")
            .setRequired(true)
        )
    ),
];
