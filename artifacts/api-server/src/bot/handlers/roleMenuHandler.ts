import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  GuildMember,
  Role,
  Guild,
} from "discord.js";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;
const BUTTONS_PER_ROW = 5;
const MAX_ROWS = 5;
const BUTTONS_PER_MESSAGE = BUTTONS_PER_ROW * MAX_ROWS; // 25

function getSelectableRoles(guild: Guild): Role[] {
  return guild.roles.cache
    .filter((r) => !r.managed && r.id !== guild.id && r.name !== "@everyone")
    .sort((a, b) => b.position - a.position)
    .map((r) => r);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildRows(roles: Role[]): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const roleChunks = chunk(roles, BUTTONS_PER_ROW);
  for (const group of roleChunks.slice(0, MAX_ROWS)) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      group.map((r) =>
        new ButtonBuilder()
          .setCustomId(`role_toggle:${r.id}`)
          .setLabel(r.name)
          .setStyle(ButtonStyle.Secondary)
      )
    );
    rows.push(row);
  }
  return rows;
}

export async function handleRollenMenu(interaction: ChatInputCommandInteraction) {
  const titel = interaction.options.getString("titel", true);
  const beschrijving =
    interaction.options.getString("beschrijving") ??
    "Klik op een knop om een rol te ontvangen of te verwijderen. Je kunt meerdere rollen kiezen.";

  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "Dit command werkt alleen in een server.", ephemeral: true });
    return;
  }

  await guild.roles.fetch();
  const roles = getSelectableRoles(guild);

  if (roles.length === 0) {
    await interaction.reply({ content: "Er zijn geen selecteerbare rollen gevonden in deze server.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: "✅ Rollenmenu aangemaakt!", ephemeral: true });

  // Split into pages of 25 buttons each, post multiple messages if needed
  const pages = chunk(roles, BUTTONS_PER_MESSAGE);

  for (let i = 0; i < pages.length; i++) {
    const pageRoles = pages[i];
    const rows = buildRows(pageRoles);

    const embed = new EmbedBuilder()
      .setColor(HOTEL_GOLD)
      .setTitle(i === 0 ? `🎭 ${titel}` : `🎭 ${titel} (vervolg ${i + 1})`)
      .setDescription(i === 0 ? beschrijving : "Nog meer rollen om te kiezen:")
      .setFooter({
        text: `Hotel Rollensysteem • Klik een knop om een rol aan/uit te zetten`,
      })
      .setTimestamp();

    await interaction.channel?.send({ embeds: [embed], components: rows });
  }
}

export async function handleRoleToggle(interaction: ButtonInteraction) {
  const roleId = interaction.customId.split(":")[1];
  if (!roleId) return;

  const member = interaction.member as GuildMember;
  const guild = interaction.guild;
  if (!member || !guild) {
    await interaction.reply({ content: "Er is iets misgegaan.", ephemeral: true });
    return;
  }

  const role = guild.roles.cache.get(roleId);
  if (!role) {
    await interaction.reply({ content: "Deze rol bestaat niet meer.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role);
      await interaction.editReply({ content: `❌ De rol **${role.name}** is van jou verwijderd.` });
    } else {
      await member.roles.add(role);
      await interaction.editReply({ content: `✅ Je hebt de rol **${role.name}** gekregen!` });
    }
  } catch (err) {
    logger.warn({ err, roleId }, "Could not toggle role");
    await interaction.editReply({ content: "Ik kon de rol niet wijzigen. Controleer of ik de juiste permissies heb." });
  }
}
