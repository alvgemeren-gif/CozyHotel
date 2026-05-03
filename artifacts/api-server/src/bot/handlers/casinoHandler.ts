import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { db } from "@workspace/db";
import { economyTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;
const WORK_COOLDOWN = 30 * 60 * 1000;
const STEAL_COOLDOWN = 60 * 60 * 1000;

const WORK_MESSAGES = [
  "je hebt de hotellobby gedweild",
  "je hebt de conciërge geholpen met bagage",
  "je hebt maaltijden uitgeserveerd in het restaurant",
  "je hebt kamers schoongemaakt op de bovenste verdieping",
  "je hebt de rooftop bar bediend",
  "je hebt gasten welkom geheten bij de receptie",
  "je hebt bloemen geschikt in de lobby",
  "je hebt de conciergebel beantwoord",
  "je hebt room service bezorgd op suite 701",
  "je hebt de piano gespeeld in de grand hall",
];

async function getOrCreate(userId: string, guildId: string) {
  const existing = await db.query.economyTable.findFirst({
    where: and(eq(economyTable.userId, userId), eq(economyTable.guildId, guildId)),
  });
  if (existing) return existing;
  const [created] = await db.insert(economyTable).values({ userId, guildId, balance: 1000 }).returning();
  return created!;
}

export async function handleBalans(interaction: ChatInputCommandInteraction) {
  const target = interaction.options.getUser("gebruiker") ?? interaction.user;
  const eco = await getOrCreate(target.id, interaction.guildId!);

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🏦 Hotel Kluis")
    .setDescription(`Balans van **${target.username}**`)
    .addFields({ name: "💰 Munten", value: `${eco.balance.toLocaleString()} 🪙`, inline: true })
    .setThumbnail(target.displayAvatarURL())
    .setFooter({ text: "Hotel Casino & Bank" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleWerk(interaction: ChatInputCommandInteraction) {
  const eco = await getOrCreate(interaction.user.id, interaction.guildId!);
  const now = Date.now();

  if (eco.lastWork && now - eco.lastWork < WORK_COOLDOWN) {
    const remaining = Math.ceil((WORK_COOLDOWN - (now - eco.lastWork)) / 60000);
    await interaction.reply({ content: `Je bent moe! Je kunt pas over **${remaining} minuten** weer werken. ⏳`, ephemeral: true });
    return;
  }

  const earned = Math.floor(Math.random() * 400) + 100;
  const job = WORK_MESSAGES[Math.floor(Math.random() * WORK_MESSAGES.length)];

  await db.update(economyTable)
    .set({ balance: eco.balance + earned, lastWork: now })
    .where(and(eq(economyTable.userId, interaction.user.id), eq(economyTable.guildId, interaction.guildId!)));

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("💼 Dienst Afgerond")
    .setDescription(`Je hebt gewerkt: **${job}** en **${earned} 🪙** verdiend!\nNieuw saldo: **${(eco.balance + earned).toLocaleString()} 🪙**`)
    .setFooter({ text: "Hotel HR Afdeling" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleSteel(interaction: ChatInputCommandInteraction) {
  const victim = interaction.options.getUser("slachtoffer", true);
  if (victim.id === interaction.user.id) {
    await interaction.reply({ content: "Je kunt jezelf niet bestelen! 😄", ephemeral: true });
    return;
  }
  if (victim.bot) {
    await interaction.reply({ content: "Je kunt de bot niet bestelen!", ephemeral: true });
    return;
  }

  const thief = await getOrCreate(interaction.user.id, interaction.guildId!);
  const now = Date.now();

  if (thief.lastSteal && now - thief.lastSteal < STEAL_COOLDOWN) {
    const remaining = Math.ceil((STEAL_COOLDOWN - (now - thief.lastSteal)) / 60000);
    await interaction.reply({ content: `De beveiliging let op jou! Wacht **${remaining} minuten** voordat je het opnieuw probeert. 🚨`, ephemeral: true });
    return;
  }

  const victimEco = await getOrCreate(victim.id, interaction.guildId!);
  if (victimEco.balance < 50) {
    await interaction.reply({ content: `**${victim.username}** heeft bijna niets in de kluis. Niet de moeite waard! 💸`, ephemeral: true });
    return;
  }

  const success = Math.random() < 0.5;
  await db.update(economyTable)
    .set({ lastSteal: now })
    .where(and(eq(economyTable.userId, interaction.user.id), eq(economyTable.guildId, interaction.guildId!)));

  if (success) {
    const pct = Math.random() * 0.15 + 0.10;
    const stolen = Math.floor(victimEco.balance * pct);
    await db.update(economyTable)
      .set({ balance: victimEco.balance - stolen })
      .where(and(eq(economyTable.userId, victim.id), eq(economyTable.guildId, interaction.guildId!)));
    await db.update(economyTable)
      .set({ balance: thief.balance + stolen })
      .where(and(eq(economyTable.userId, interaction.user.id), eq(economyTable.guildId, interaction.guildId!)));

    const embed = new EmbedBuilder()
      .setColor(0x228B22)
      .setTitle("🎩 Succesvolle Diefstal")
      .setDescription(`Je bent ongemerkt de kluis van **${victim.username}** binnengeslopen en hebt **${stolen} 🪙** gestolen!`)
      .setFooter({ text: "Hotel Beveiligingsdienst • Incident gemeld" })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  } else {
    const penalty = Math.floor(thief.balance * 0.10);
    await db.update(economyTable)
      .set({ balance: Math.max(0, thief.balance - penalty) })
      .where(and(eq(economyTable.userId, interaction.user.id), eq(economyTable.guildId, interaction.guildId!)));

    const embed = new EmbedBuilder()
      .setColor(0x8B0000)
      .setTitle("🚨 Betrapt!")
      .setDescription(`De hotelbeveiliging heeft je betrapt terwijl je de kluis van **${victim.username}** probeerde te openen! Je bent **${penalty} 🪙** kwijt als boete.`)
      .setFooter({ text: "Hotel Beveiligingsdienst" })
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
}

const SLOTS = ["🍒", "💎", "🍋", "🍇", "🔔", "🃏", "⭐", "💰"];

export async function handleGokken(interaction: ChatInputCommandInteraction) {
  const inzet = interaction.options.getInteger("inzet", true);
  const eco = await getOrCreate(interaction.user.id, interaction.guildId!);

  if (eco.balance < inzet) {
    await interaction.reply({ content: `Je hebt niet genoeg munten! Jouw saldo: **${eco.balance} 🪙**`, ephemeral: true });
    return;
  }

  const s1 = SLOTS[Math.floor(Math.random() * SLOTS.length)]!;
  const s2 = SLOTS[Math.floor(Math.random() * SLOTS.length)]!;
  const s3 = SLOTS[Math.floor(Math.random() * SLOTS.length)]!;

  let winst = 0;
  let resultaatTekst = "";

  if (s1 === s2 && s2 === s3) {
    if (s1 === "💎") {
      winst = inzet * 10;
      resultaatTekst = "💎 JACKPOT! DIAMANTEN! 💎 Ongelooflijk!";
    } else if (s1 === "💰") {
      winst = inzet * 7;
      resultaatTekst = "💰 GOUD! Jij bent de geluksvogel van het casino!";
    } else {
      winst = inzet * 4;
      resultaatTekst = "⭐ Drie op een rij! Schitterend!";
    }
  } else if (s1 === s2 || s2 === s3 || s1 === s3) {
    winst = Math.floor(inzet * 1.5);
    resultaatTekst = "Twee op een rij! Kleine winst!";
  } else {
    winst = 0;
    resultaatTekst = "Helaas, geen match. Volgende keer beter!";
  }

  const newBalance = eco.balance - inzet + winst;
  await db.update(economyTable)
    .set({ balance: Math.max(0, newBalance) })
    .where(and(eq(economyTable.userId, interaction.user.id), eq(economyTable.guildId, interaction.guildId!)));

  const embed = new EmbedBuilder()
    .setColor(winst > 0 ? HOTEL_GOLD : 0x8B0000)
    .setTitle("🎰 Hotel Casino — Gokautomaat")
    .setDescription(`**[ ${s1} | ${s2} | ${s3} ]**\n\n${resultaatTekst}`)
    .addFields(
      { name: "Inzet", value: `${inzet} 🪙`, inline: true },
      { name: "Winst", value: `${winst} 🪙`, inline: true },
      { name: "Nieuw saldo", value: `${Math.max(0, newBalance).toLocaleString()} 🪙`, inline: true }
    )
    .setFooter({ text: "Hotel Casino • Speel verantwoord" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function handleRijksten(interaction: ChatInputCommandInteraction) {
  const top = await db.select().from(economyTable)
    .where(eq(economyTable.guildId, interaction.guildId!))
    .orderBy(desc(economyTable.balance))
    .limit(10);

  const lines = await Promise.all(
    top.map(async (e, i) => {
      const user = await interaction.client.users.fetch(e.userId).catch(() => null);
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      return `${medal} **${user?.username ?? "Onbekend"}** — ${e.balance.toLocaleString()} 🪙`;
    })
  );

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("💰 De Rijkste Hotelgasten")
    .setDescription(lines.join("\n") || "Nog niemand heeft munten.")
    .setFooter({ text: "Hotel Forbes Lijst" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
