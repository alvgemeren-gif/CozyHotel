import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { WORDLE_WORDS, HANGMAN_WORDS } from "../data/words";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

interface WordleGame {
  word: string;
  guesses: string[];
  userId: string;
  startedAt: number;
}

interface HangmanGame {
  word: string;
  guessed: Set<string>;
  wrong: string[];
  userId: string;
}

const wordleGames = new Map<string, WordleGame>();
const hangmanGames = new Map<string, HangmanGame>();

const HANGMAN_STAGES = [
  "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",
  "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```",
];

function getWordleEmoji(letter: string, pos: number, word: string, guess: string): string {
  if (word[pos] === letter) return "🟩";
  if (word.includes(letter)) return "🟨";
  return "⬛";
}

function renderWordleGrid(game: WordleGame): string {
  const rows = game.guesses.map((guess) => {
    return [...guess].map((l, i) => getWordleEmoji(l, i, game.word, guess)).join(" ");
  });
  while (rows.length < 6) rows.push("⬜ ⬜ ⬜ ⬜ ⬜");
  return rows.join("\n");
}

export async function handleWordleStart(interaction: ChatInputCommandInteraction) {
  const key = `${interaction.guildId}:${interaction.channelId}`;
  const word = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)]!.toLowerCase();
  wordleGames.set(key, { word, guesses: [], userId: interaction.user.id, startedAt: Date.now() });

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🔤 Hotel Wordle")
    .setDescription(
      "Raad het 5-letterwoord in maximaal 6 pogingen!\n\n" +
      "🟩 = juiste letter, juiste positie\n" +
      "🟨 = juiste letter, foute positie\n" +
      "⬛ = letter niet aanwezig\n\n" +
      "⬜ ⬜ ⬜ ⬜ ⬜\n⬜ ⬜ ⬜ ⬜ ⬜\n⬜ ⬜ ⬜ ⬜ ⬜\n⬜ ⬜ ⬜ ⬜ ⬜\n⬜ ⬜ ⬜ ⬜ ⬜\n⬜ ⬜ ⬜ ⬜ ⬜"
    )
    .setFooter({ text: "Gebruik /wordle raad <woord> om te gokken" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleWordleGuess(interaction: ChatInputCommandInteraction) {
  const key = `${interaction.guildId}:${interaction.channelId}`;
  const game = wordleGames.get(key);

  if (!game) {
    await interaction.reply({ content: "Er is geen actief Wordle-spel. Start één met `/wordle start`.", ephemeral: true });
    return;
  }

  const guess = (interaction.options.getString("woord") ?? "").toLowerCase();

  if (guess.length !== 5) {
    await interaction.reply({ content: "Jouw gok moet precies 5 letters lang zijn!", ephemeral: true });
    return;
  }

  if (!/^[a-z]+$/.test(guess)) {
    await interaction.reply({ content: "Gebruik alleen letters (a-z).", ephemeral: true });
    return;
  }

  game.guesses.push(guess);

  const grid = renderWordleGrid(game);
  const won = guess === game.word;
  const lost = game.guesses.length >= 6 && !won;

  const embed = new EmbedBuilder()
    .setColor(won ? 0x228B22 : lost ? 0x8B0000 : HOTEL_GOLD)
    .setTitle("🔤 Hotel Wordle")
    .setDescription(grid)
    .setTimestamp();

  if (won) {
    wordleGames.delete(key);
    embed.addFields({ name: "🎉 Gewonnen!", value: `Je hebt het woord **${game.word.toUpperCase()}** geraden in ${game.guesses.length} poging(en)!` });
  } else if (lost) {
    wordleGames.delete(key);
    embed.addFields({ name: "😔 Verloren", value: `Het woord was **${game.word.toUpperCase()}**. Probeer het opnieuw met /wordle start!` });
  } else {
    embed.setFooter({ text: `Poging ${game.guesses.length}/6` });
  }

  await interaction.reply({ embeds: [embed] });
}

export async function handleMijnenveger(interaction: ChatInputCommandInteraction) {
  const difficulty = interaction.options.getString("moeilijkheid") ?? "medium";

  let size: number, mines: number;
  if (difficulty === "easy") { size = 5; mines = 3; }
  else if (difficulty === "hard") { size = 9; mines = 15; }
  else { size = 7; mines = 8; }

  const grid = Array.from({ length: size }, () => Array(size).fill(0)) as number[][];
  const minePos = new Set<number>();

  while (minePos.size < mines) {
    minePos.add(Math.floor(Math.random() * size * size));
  }

  for (const pos of minePos) {
    const r = Math.floor(pos / size);
    const c = pos % size;
    grid[r]![c] = -1;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r]![c] === -1) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr]![nc] === -1) count++;
        }
      }
      grid[r]![c] = count;
    }
  }

  const CELL_EMOJI = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];

  const rows = grid.map((row) =>
    row.map((cell) => {
      if (cell === -1) return "||💣||";
      if (cell === 0) return "||🟦||";
      return `||${CELL_EMOJI[cell]}||`;
    }).join("")
  );

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("💣 Hotel Mijnenveger")
    .setDescription(rows.join("\n"))
    .addFields(
      { name: "Formaat", value: `${size}x${size}`, inline: true },
      { name: "Mijnen", value: `${mines}`, inline: true }
    )
    .setFooter({ text: "Klik op de spoiler-vakjes om ze te onthullen!" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleGalgjeStart(interaction: ChatInputCommandInteraction) {
  const key = `${interaction.guildId}:${interaction.user.id}`;
  const word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)]!.toLowerCase();
  hangmanGames.set(key, { word, guessed: new Set(), wrong: [], userId: interaction.user.id });

  const display = [...word].map((l) => "\\_ ").join("");

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🪢 Hotel Galgje")
    .setDescription(HANGMAN_STAGES[0] + `\n**Woord:** ${display}\n\n**Lengte:** ${word.length} letters`)
    .setFooter({ text: "Gebruik /galgje raad <letter> om te raden" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleGalgjeGuess(interaction: ChatInputCommandInteraction) {
  const key = `${interaction.guildId}:${interaction.user.id}`;
  const game = hangmanGames.get(key);

  if (!game) {
    await interaction.reply({ content: "Je hebt geen actief Galgje-spel. Start één met `/galgje start`.", ephemeral: true });
    return;
  }

  const input = interaction.options.getString("letter", true).toLowerCase().trim();

  if (input === game.word) {
    hangmanGames.delete(key);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x228B22)
          .setTitle("🎉 Galgje Gewonnen!")
          .setDescription(`Je hebt het woord **${game.word}** geraden!`)
          .setTimestamp(),
      ],
    });
    return;
  }

  if (input.length !== 1) {
    await interaction.reply({ content: "Geef één letter of het volledige woord.", ephemeral: true });
    return;
  }

  if (game.guessed.has(input)) {
    await interaction.reply({ content: `Je hebt **${input}** al geraden!`, ephemeral: true });
    return;
  }

  game.guessed.add(input);

  if (!game.word.includes(input)) {
    game.wrong.push(input);
  }

  const display = [...game.word].map((l) => (game.guessed.has(l) ? l : "\\_")).join(" ");
  const stage = Math.min(game.wrong.length, HANGMAN_STAGES.length - 1);
  const won = [...game.word].every((l) => game.guessed.has(l));
  const lost = game.wrong.length >= 6;

  const embed = new EmbedBuilder()
    .setColor(won ? 0x228B22 : lost ? 0x8B0000 : HOTEL_GOLD)
    .setTitle("🪢 Hotel Galgje")
    .setDescription(
      HANGMAN_STAGES[stage] +
      `\n**Woord:** ${display}\n\n` +
      `**Fout geraden:** ${game.wrong.length > 0 ? game.wrong.join(", ") : "—"} (${game.wrong.length}/6)`
    )
    .setTimestamp();

  if (won) {
    hangmanGames.delete(key);
    embed.addFields({ name: "🎉 Gewonnen!", value: `Het woord was **${game.word}**!` });
  } else if (lost) {
    hangmanGames.delete(key);
    embed.addFields({ name: "😔 Verloren", value: `Het woord was **${game.word}**. Probeer opnieuw!` });
  }

  await interaction.reply({ embeds: [embed] });
}
