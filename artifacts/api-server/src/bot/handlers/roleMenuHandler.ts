import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  StringSelectMenuInteraction,
  GuildMember,
  Role,
  Guild,
} from "discord.js";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;
const CHUNK_SIZE = 25;
const MAX_MENUS = 5;

function getSelectableRoles(guild: Guild): Role[] {
  return guild.roles.cache
    .filter(
      (r) =>
        !r.managed &&
        r.id !== guild.id &&
        r.name !== "@everyone"
    )
    .sort((a, b) => b.position - a.position)
    .map((r) => r);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function handleRollenMenu(interaction: ChatInputCommandInteraction) {
  const titel = interaction.options.getString("titel", true);
  const beschrijving =
    interaction.options.getString("beschrijving") ??
    "Selecteer hieronder de rollen die je wil ontvangen. Je kunt er meerdere kiezen via elk dropdown menu.";

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

  const groups = chunk(roles, CHUNK_SIZE).slice(0, MAX_MENUS);

  const rows = groups.map((group, idx) => {
    const roleIds = group.map((r) => r.id).join(",");
    const select = new StringSelectMenuBuilder()
      .setCustomId(`rolemenu_select:${roleIds}`)
      .setPlaceholder(
        groups.length > 1
          ? `Rollen ${idx * CHUNK_SIZE + 1}–${idx * CHUNK_SIZE + group.length} — kies er een of meer`
          : "Kies jouw rollen..."
      )
      .setMinValues(0)
      .setMaxValues(group.length)
      .addOptions(
        group.map((r) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(r.name)
            .setValue(r.id)
        )
      );

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  });

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle(`🎭 ${titel}`)
    .setDescription(beschrijving)
    .addFields({
      name: `${roles.length} beschikbare rollen`,
      value:
        roles.length <= 40
          ? roles.map((r) => `<@&${r.id}>`).join(" · ")
          : roles.slice(0, 40).map((r) => `<@&${r.id}>`).join(" · ") +
            ` · ...en ${roles.length - 40} meer`,
    })
    .setFooter({
      text: `Hotel Rollensysteem • Selecteer via de menu's hieronder${groups.length > 1 ? ` (${groups.length} menu's)` : ""}`,
    })
    .setTimestamp();

  await interaction.reply({ content: "✅ Rollenmenu aangemaakt!", ephemeral: true });
  await interaction.channel?.send({ embeds: [embed], components: rows });
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
      await member.roles.add(role).catch((err) =>
        logger.warn({ err, roleId }, "Could not add role")
      );
      added.push(role.name);
    } else if (!selected.has(roleId) && has) {
      await member.roles.remove(role).catch((err) =>
        logger.warn({ err, roleId }, "Could not remove role")
      );
      removed.push(role.name);
    }
  }

  const lines: string[] = [];
  if (added.length) lines.push(`✅ **Gekregen:** ${added.join(", ")}`);
  if (removed.length) lines.push(`❌ **Verwijderd:** ${removed.join(", ")}`);
  if (!lines.length) lines.push("Je rollen zijn ongewijzigd.");

  await interaction.editReply({ content: lines.join("\n") });
}
