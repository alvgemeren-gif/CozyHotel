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
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { db } from "@workspace/db";
import { levelRewardsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;
const BUTTONS_PER_ROW = 5;

// In-memory session: key = `${guildId}:${userId}`
interface Session {
  titel: string;
  beschrijving: string;
  channelId: string;
  allRoleIds: string[]; // all selectable role ids in order
  selectedRoleIds: Set<string>;
}
const sessions = new Map<string, Session>();

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

// Build the ephemeral setup embed for the admin
function buildSetupMessage(session: Session, guild: Guild) {
  const selected = session.selectedRoleIds;
  const roles = session.allRoleIds
    .map((id) => guild.roles.cache.get(id))
    .filter(Boolean) as Role[];

  const groups = chunk(roles, 25).slice(0, 4); // max 4 selection dropdowns + 1 button row

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("⚙️ Rollenmenu instellen")
    .setDescription(
      `**Titel:** ${session.titel}\n\nSelecteer de rollen die je in het publieke menu wil plaatsen. Geselecteerd: **${selected.size}** rollen.`
    )
    .addFields({
      name: "Gekozen rollen",
      value:
        selected.size > 0
          ? [...selected].map((id) => `<@&${id}>`).join(" ")
          : "_Nog niets geselecteerd_",
    })
    .setFooter({ text: "Klik 'Publiceer' als je klaar bent" });

  const rows: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [];

  groups.forEach((group, idx) => {
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`rolemenu_setup_select:${idx}`)
      .setPlaceholder(
        groups.length > 1
          ? `Rollen ${idx * 25 + 1}–${idx * 25 + group.length} — klik aan/uit`
          : "Selecteer rollen voor het menu"
      )
      .setMinValues(0)
      .setMaxValues(group.length)
      .addOptions(
        group.map((r) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(r.name)
            .setValue(r.id)
            .setDefault(selected.has(r.id))
        )
      );
    rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu));
  });

  // Publish button row
  const publishRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("rolemenu_publish")
      .setLabel("✅ Publiceer rollenmenu")
      .setStyle(ButtonStyle.Success)
      .setDisabled(selected.size === 0),
    new ButtonBuilder()
      .setCustomId("rolemenu_cancel")
      .setLabel("❌ Annuleren")
      .setStyle(ButtonStyle.Danger)
  );
  rows.push(publishRow);

  return { embeds: [embed], components: rows };
}

export async function handleRollenMenu(interaction: ChatInputCommandInteraction) {
  const titel = interaction.options.getString("titel", true);
  const beschrijving =
    interaction.options.getString("beschrijving") ??
    "Klik op een knop om een rol te ontvangen of te verwijderen.";

  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "Dit command werkt alleen in een server.", ephemeral: true });
    return;
  }

  await guild.roles.fetch();
  const roles = getSelectableRoles(guild);

  if (roles.length === 0) {
    await interaction.reply({ content: "Er zijn geen selecteerbare rollen in deze server.", ephemeral: true });
    return;
  }

  const key = `${guild.id}:${interaction.user.id}`;
  const session: Session = {
    titel,
    beschrijving,
    channelId: interaction.channelId,
    allRoleIds: roles.map((r) => r.id),
    selectedRoleIds: new Set(),
  };
  sessions.set(key, session);

  const msg = buildSetupMessage(session, guild);
  await interaction.reply({ ...msg, ephemeral: true });
}

export async function handleRoleMenuSetupSelect(interaction: StringSelectMenuInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const key = `${guild.id}:${interaction.user.id}`;
  const session = sessions.get(key);
  if (!session) {
    await interaction.reply({ content: "Sessie verlopen. Gebruik `/rollen-menu` opnieuw.", ephemeral: true });
    return;
  }

  // The selected values from this dropdown replace the choices for this group
  // First figure out which group this dropdown covers
  const idx = parseInt(interaction.customId.split(":")[1] ?? "0", 10);
  const groupRoleIds = chunk(session.allRoleIds, 25)[idx] ?? [];

  // Remove all roles in this group from selection, then add back the chosen ones
  for (const id of groupRoleIds) session.selectedRoleIds.delete(id);
  for (const id of interaction.values) session.selectedRoleIds.add(id);

  const msg = buildSetupMessage(session, guild);
  await interaction.update({ ...msg });
}

export async function handleRoleMenuPublish(interaction: ButtonInteraction) {
  const guild = interaction.guild;
  if (!guild) return;

  const key = `${guild.id}:${interaction.user.id}`;
  const session = sessions.get(key);
  if (!session) {
    await interaction.reply({ content: "Sessie verlopen. Gebruik `/rollen-menu` opnieuw.", ephemeral: true });
    return;
  }

  const selectedIds = [...session.selectedRoleIds];
  if (selectedIds.length === 0) {
    await interaction.reply({ content: "Selecteer minimaal één rol.", ephemeral: true });
    return;
  }

  await guild.roles.fetch();
  const roles = selectedIds
    .map((id) => guild.roles.cache.get(id))
    .filter(Boolean) as Role[];

  // Build public button menu (up to 25 buttons = 5 rows × 5)
  const groups = chunk(roles, BUTTONS_PER_ROW);
  const rows = groups.slice(0, 5).map(
    (group) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        group.map((r) =>
          new ButtonBuilder()
            .setCustomId(`role_toggle:${r.id}`)
            .setLabel(r.name)
            .setStyle(ButtonStyle.Secondary)
        )
      )
  );

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle(`🎭 ${session.titel}`)
    .setDescription(session.beschrijving)
    .setFooter({ text: "Hotel Rollensysteem • Klik een knop om een rol aan/uit te zetten" })
    .setTimestamp();

  const channel = guild.channels.cache.get(session.channelId);
  if (!channel?.isTextBased()) {
    await interaction.reply({ content: "Kanaal niet gevonden.", ephemeral: true });
    return;
  }

  await channel.send({ embeds: [embed], components: rows });
  sessions.delete(key);

  await interaction.update({
    content: `✅ Rollenmenu met **${roles.length} rollen** is geplaatst!`,
    embeds: [],
    components: [],
  });
}

export async function handleRoleMenuCancel(interaction: ButtonInteraction) {
  const key = `${interaction.guild?.id}:${interaction.user.id}`;
  sessions.delete(key);
  await interaction.update({ content: "❌ Geannuleerd.", embeds: [], components: [] });
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
    const hasRole = member.roles.cache.has(roleId);

    // Block removal if this role is a level reward — it must be kept permanently
    if (hasRole) {
      const isReward = await db.query.levelRewardsTable.findFirst({
        where: and(
          eq(levelRewardsTable.guildId, guild.id),
          eq(levelRewardsTable.roleId, roleId)
        ),
      });
      if (isReward) {
        await interaction.editReply({
          content: `🔒 De rol **${role.name}** is een levelbeloning en kan niet worden verwijderd.`,
        });
        return;
      }
    }

    if (hasRole) {
      await member.roles.remove(role);
      await interaction.editReply({ content: `❌ De rol **${role.name}** is van jou verwijderd.` });
    } else {
      await member.roles.add(role);
      await interaction.editReply({ content: `✅ Je hebt de rol **${role.name}** gekregen!` });
    }
  } catch (err) {
    logger.warn({ err, roleId }, "Could not toggle role");
    await interaction.editReply({
      content: "Ik kon de rol niet wijzigen. Controleer of de bot de juiste permissies heeft.",
    });
  }
}
