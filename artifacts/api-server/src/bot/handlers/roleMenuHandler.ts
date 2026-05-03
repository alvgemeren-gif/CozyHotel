import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction,
  GuildMember,
  Role,
} from "discord.js";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

export async function handleRollenMenu(interaction: ChatInputCommandInteraction) {
  const titel = interaction.options.getString("titel", true);
  const beschrijving = interaction.options.getString("beschrijving") ??
    "Selecteer de rollen die jij wil ontvangen. Je kunt er meerdere kiezen.";

  const roles: Role[] = [];
  for (let i = 1; i <= 10; i++) {
    const role = interaction.options.getRole(`rol${i}`);
    if (role) roles.push(role as Role);
  }

  if (roles.length === 0) {
    await interaction.reply({ content: "Voeg minimaal één rol toe.", ephemeral: true });
    return;
  }

  const roleIds = roles.map((r) => r.id).join(",");

  const select = new StringSelectMenuBuilder()
    .setCustomId(`rolemenu_select:${roleIds}`)
    .setPlaceholder("Kies jouw rollen...")
    .setMinValues(0)
    .setMaxValues(roles.length)
    .addOptions(
      roles.map((r) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(r.name)
          .setValue(r.id)
          .setDescription(`Klik om de rol ${r.name} te ontvangen of te verwijderen`)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle(`🎭 ${titel}`)
    .setDescription(beschrijving)
    .addFields({
      name: "Beschikbare rollen",
      value: roles.map((r) => `• <@&${r.id}>`).join("\n"),
    })
    .setFooter({ text: "Hotel Rollensysteem • Selecteer en bevestig via het menu" })
    .setTimestamp();

  await interaction.reply({ content: "✅ Rollenmenu aangemaakt!", ephemeral: true });
  await interaction.channel?.send({ embeds: [embed], components: [row] });
}

export async function handleRoleMenuSelect(interaction: StringSelectMenuInteraction) {
  const parts = interaction.customId.split(":");
  const roleIds = parts[1]?.split(",") ?? [];
  const member = interaction.member as GuildMember;

  if (!member || !interaction.guild) {
    await interaction.reply({ content: "Er is iets misgegaan.", ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const selected = new Set(interaction.values);
  const added: string[] = [];
  const removed: string[] = [];

  for (const roleId of roleIds) {
    const role = interaction.guild.roles.cache.get(roleId);
    if (!role) continue;

    const has = member.roles.cache.has(roleId);

    if (selected.has(roleId) && !has) {
      await member.roles.add(role).catch(() => {});
      added.push(role.name);
    } else if (!selected.has(roleId) && has) {
      await member.roles.remove(role).catch(() => {});
      removed.push(role.name);
    }
  }

  const lines: string[] = [];
  if (added.length) lines.push(`✅ **Gekregen:** ${added.join(", ")}`);
  if (removed.length) lines.push(`❌ **Verwijderd:** ${removed.join(", ")}`);
  if (!lines.length) lines.push("Je rollen zijn ongewijzigd.");

  await interaction.editReply({ content: lines.join("\n") });
}
