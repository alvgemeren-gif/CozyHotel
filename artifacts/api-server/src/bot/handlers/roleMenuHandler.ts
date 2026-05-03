import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ButtonInteraction,
  GuildMember,
} from "discord.js";
import { db } from "@workspace/db";
import { roleMenusTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

const roleMenuBuffer = new Map<string, { roleId: string; roleName: string }[]>();

export async function handleRoleMenuMaak(interaction: ChatInputCommandInteraction) {
  const title = interaction.options.getString("titel", true);
  const description = interaction.options.getString("beschrijving") ?? "Klik op een knop om een rol te ontvangen of te verwijderen.";
  const guildId = interaction.guildId!;

  const roles = roleMenuBuffer.get(guildId) ?? [];

  if (roles.length === 0) {
    await interaction.reply({
      content: "Voeg eerst rollen toe via `/role-menu-rol` voordat je een menu aanmaakt.",
      ephemeral: true,
    });
    return;
  }

  const buttons = roles.map((r) =>
    new ButtonBuilder()
      .setCustomId(`role_toggle:${r.roleId}`)
      .setLabel(r.roleName)
      .setStyle(ButtonStyle.Primary)
  );

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.slice(i, i + 5)));
  }

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle(`🎭 ${title}`)
    .setDescription(description)
    .setFooter({ text: "Hotel Rollensysteem • Klik om een rol te selecteren" });

  const msg = await interaction.channel?.send({ embeds: [embed], components: rows });

  if (msg) {
    await db.insert(roleMenusTable).values({
      guildId,
      channelId: interaction.channelId,
      messageId: msg.id,
      roles: JSON.stringify(roles),
    }).onConflictDoNothing();
  }

  roleMenuBuffer.delete(guildId);
  await interaction.reply({ content: "✅ Rollenmenu aangemaakt!", ephemeral: true });
}

export async function handleRoleMenuRol(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole("rol", true);
  const actie = interaction.options.getString("actie", true);
  const guildId = interaction.guildId!;

  const current = roleMenuBuffer.get(guildId) ?? [];

  if (actie === "add") {
    if (current.find((r) => r.roleId === role.id)) {
      await interaction.reply({ content: `De rol **${role.name}** staat al in de buffer.`, ephemeral: true });
      return;
    }
    if (current.length >= 25) {
      await interaction.reply({ content: "Je kunt maximaal 25 rollen in een menu hebben.", ephemeral: true });
      return;
    }
    current.push({ roleId: role.id, roleName: role.name });
    roleMenuBuffer.set(guildId, current);
    await interaction.reply({
      content: `✅ **${role.name}** toegevoegd. Huidig aantal rollen in buffer: ${current.length}`,
      ephemeral: true,
    });
  } else {
    const filtered = current.filter((r) => r.roleId !== role.id);
    roleMenuBuffer.set(guildId, filtered);
    await interaction.reply({
      content: `✅ **${role.name}** verwijderd uit buffer. Resten: ${filtered.length}`,
      ephemeral: true,
    });
  }
}

export async function handleRoleMenuLijst(interaction: ChatInputCommandInteraction) {
  const buffer = roleMenuBuffer.get(interaction.guildId!) ?? [];
  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🎭 Rollen in Buffer")
    .setDescription(
      buffer.length
        ? buffer.map((r) => `• @${r.roleName}`).join("\n")
        : "Geen rollen in de buffer. Voeg toe via `/role-menu-rol`."
    )
    .setFooter({ text: "Gebruik /role-menu-maak om het menu aan te maken." });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function handleRoleToggle(interaction: ButtonInteraction) {
  const roleId = interaction.customId.split(":")[1]!;
  const member = interaction.member as GuildMember;

  try {
    const role = interaction.guild?.roles.cache.get(roleId);
    if (!role) {
      await interaction.reply({ content: "Rol niet gevonden.", ephemeral: true });
      return;
    }

    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(role);
      await interaction.reply({ content: `De rol **${role.name}** is van jou verwijderd.`, ephemeral: true });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: `Je hebt de rol **${role.name}** ontvangen! 🎉`, ephemeral: true });
    }
  } catch (err) {
    logger.error({ err }, "Role toggle error");
    await interaction.reply({ content: "Er is iets misgegaan bij het toewijzen van de rol.", ephemeral: true });
  }
}
