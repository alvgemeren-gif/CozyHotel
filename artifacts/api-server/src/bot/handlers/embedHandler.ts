import { ChatInputCommandInteraction, EmbedBuilder, TextChannel } from "discord.js";

const HOTEL_GOLD = 0xD4AF37;

function parseColor(hex: string | null): number {
  if (!hex) return HOTEL_GOLD;
  const clean = hex.replace("#", "");
  const parsed = parseInt(clean, 16);
  return isNaN(parsed) ? HOTEL_GOLD : parsed;
}

export async function handleEmbed(interaction: ChatInputCommandInteraction) {
  const titel = interaction.options.getString("titel", true);
  const beschrijving = interaction.options.getString("beschrijving", true);
  const kleur = parseColor(interaction.options.getString("kleur"));
  const afbeelding = interaction.options.getString("afbeelding");
  const thumbnail = interaction.options.getString("thumbnail");
  const footer = interaction.options.getString("footer");

  const embed = new EmbedBuilder()
    .setColor(kleur)
    .setTitle(titel)
    .setDescription(beschrijving);

  if (afbeelding) embed.setImage(afbeelding);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (footer) embed.setFooter({ text: footer });

  await interaction.reply({ content: "✅ Embed aangemaakt!", ephemeral: true });
  await interaction.channel?.send({ embeds: [embed] });
}

export async function handleEmbedBewerk(interaction: ChatInputCommandInteraction) {
  const berichtId = interaction.options.getString("bericht-id", true);
  const channel = interaction.channel as TextChannel;

  let bericht;
  try {
    bericht = await channel.messages.fetch(berichtId);
  } catch {
    await interaction.reply({ content: "❌ Bericht niet gevonden in dit kanaal. Controleer het ID.", ephemeral: true });
    return;
  }

  if (bericht.author.id !== interaction.client.user?.id) {
    await interaction.reply({ content: "❌ Ik kan alleen embeds bewerken die ik zelf heb geplaatst.", ephemeral: true });
    return;
  }

  const oudeEmbed = bericht.embeds[0];
  if (!oudeEmbed) {
    await interaction.reply({ content: "❌ Dit bericht heeft geen embed.", ephemeral: true });
    return;
  }

  const titel = interaction.options.getString("titel");
  const beschrijving = interaction.options.getString("beschrijving");
  const kleurRaw = interaction.options.getString("kleur");
  const afbeelding = interaction.options.getString("afbeelding");
  const thumbnail = interaction.options.getString("thumbnail");
  const footer = interaction.options.getString("footer");

  const nieuweEmbed = EmbedBuilder.from(oudeEmbed);

  if (titel) nieuweEmbed.setTitle(titel);
  if (beschrijving) nieuweEmbed.setDescription(beschrijving);
  if (kleurRaw) nieuweEmbed.setColor(parseColor(kleurRaw));
  if (afbeelding) nieuweEmbed.setImage(afbeelding);
  if (thumbnail) nieuweEmbed.setThumbnail(thumbnail);
  if (footer) nieuweEmbed.setFooter({ text: footer });

  await bericht.edit({ embeds: [nieuweEmbed] });
  await interaction.reply({ content: "✅ Embed bijgewerkt!", ephemeral: true });
}
