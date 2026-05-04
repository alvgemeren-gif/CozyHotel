import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
  CategoryChannel,
} from "discord.js";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

const TICKET_TYPES: Record<string, { label: string; emoji: string; description: string; color: number }> = {
  solliciteren: {
    label: "Solliciteren",
    emoji: "📋",
    description: "Solliciteer voor een functie in ons hotel",
    color: 0x57F287,
  },
  partnerships: {
    label: "Partnerships",
    emoji: "🤝",
    description: "Interesse in een samenwerking of partnership",
    color: 0x5865F2,
  },
  vragen: {
    label: "Vragen",
    emoji: "❓",
    description: "Stel een vraag aan ons personeel",
    color: HOTEL_GOLD,
  },
  klachten: {
    label: "Klachten",
    emoji: "📢",
    description: "Dien een klacht in bij de directie",
    color: 0xED4245,
  },
};

// Store staffRoleId per guild
const guildStaffRoles = new Map<string, string>();

export async function handleTicketSetup(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel("kanaal", true) as TextChannel;
  const staffRole = interaction.options.getRole("staff-rol", true);

  guildStaffRoles.set(interaction.guildId!, staffRole.id);

  const select = new StringSelectMenuBuilder()
    .setCustomId("ticket_open")
    .setPlaceholder("📩 Kies een categorie om een ticket te openen...")
    .addOptions(
      Object.entries(TICKET_TYPES).map(([value, info]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(info.label)
          .setValue(value)
          .setDescription(info.description)
          .setEmoji(info.emoji)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🎫 Hotel Support")
    .setDescription(
      "Heb je een vraag, klacht, of wil je solliciteren of samenwerken?\n" +
      "Selecteer hieronder de juiste categorie en we openen een privégesprek voor je.\n\n" +
      "📋 **Solliciteren** — Word onderdeel van ons team\n" +
      "🤝 **Partnerships** — Samenwerking & deals\n" +
      "❓ **Vragen** — Wij helpen je graag\n" +
      "📢 **Klachten** — Jouw feedback is belangrijk"
    )
    .setFooter({ text: "Hotel Concierge • Wij staan voor je klaar" })
    .setTimestamp();

  await channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `✅ Ticket-menu geplaatst in ${channel}!`, ephemeral: true });
}

export async function handleTicketOpen(interaction: StringSelectMenuInteraction) {
  const type = interaction.values[0]!;
  const info = TICKET_TYPES[type];
  if (!info) return;

  const guild = interaction.guild!;
  const member = interaction.member!;
  const staffRoleId = guildStaffRoles.get(guild.id);

  await interaction.deferReply({ ephemeral: true });

  // Check if user already has an open ticket of this type
  const existing = guild.channels.cache.find(
    (c) => c.name === `${type}-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}` && c.type === ChannelType.GuildText
  );
  if (existing) {
    await interaction.editReply({ content: `Je hebt al een open ticket: ${existing}` });
    return;
  }

  // Find or create Tickets category
  let category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "tickets"
  ) as CategoryChannel | undefined;

  if (!category) {
    category = await guild.channels.create({
      name: "Tickets",
      type: ChannelType.GuildCategory,
    });
  }

  // Permission overwrites
  const permissionOverwrites: any[] = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];
  if (staffRoleId) {
    permissionOverwrites.push({
      id: staffRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
    });
  }

  const safeName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
  const ticketChannel = await guild.channels.create({
    name: `${type}-${safeName}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites,
  });

  const embed = new EmbedBuilder()
    .setColor(info.color)
    .setTitle(`${info.emoji} Ticket — ${info.label}`)
    .setDescription(
      `Welkom ${interaction.user}, je ticket is aangemaakt!\n\n` +
      `**Categorie:** ${info.label}\n` +
      `Ons personeel zal zo snel mogelijk reageren. Beschrijf hieronder zo duidelijk mogelijk waarmee we je kunnen helpen.\n\n` +
      `Klik op **🔒 Sluit ticket** als je klaar bent.`
    )
    .setFooter({ text: "Hotel Concierge • Ticket systeem" })
    .setTimestamp();

  const closeBtn = new ButtonBuilder()
    .setCustomId(`ticket_close:${interaction.user.id}`)
    .setLabel("🔒 Sluit ticket")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeBtn);

  await ticketChannel.send({
    content: `${interaction.user}${staffRoleId ? ` <@&${staffRoleId}>` : ""}`,
    embeds: [embed],
    components: [row],
  });

  await interaction.editReply({ content: `✅ Je ticket is aangemaakt: ${ticketChannel}` });
}

export async function handleTicketClose(interaction: ButtonInteraction) {
  const channel = interaction.channel as TextChannel;

  const confirmEmbed = new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle("🔒 Ticket sluiten")
    .setDescription("Weet je zeker dat je dit ticket wil sluiten? Het kanaal wordt verwijderd.");

  const confirmBtn = new ButtonBuilder()
    .setCustomId("ticket_confirm_close")
    .setLabel("✅ Ja, sluit ticket")
    .setStyle(ButtonStyle.Danger);

  const cancelBtn = new ButtonBuilder()
    .setCustomId("ticket_cancel_close")
    .setLabel("❌ Annuleren")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);
  await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });
}

export async function handleTicketConfirmClose(interaction: ButtonInteraction) {
  const channel = interaction.channel as TextChannel;
  await interaction.reply({ content: "🔒 Ticket wordt gesloten...", ephemeral: true });
  await new Promise((r) => setTimeout(r, 1500));
  await channel.delete().catch((err) => logger.warn({ err }, "Could not delete ticket channel"));
}

export async function handleTicketCancelClose(interaction: ButtonInteraction) {
  await interaction.update({ content: "Annulering — ticket blijft open.", embeds: [], components: [] });
}
