import { ChatInputCommandInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { db } from "@workspace/db";
import { autorolesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../../lib/logger";

const HOTEL_GOLD = 0xD4AF37;

export async function handleAutoroleToevoegen(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole("rol", true);

  const existing = await db.query.autorolesTable.findFirst({
    where: and(
      eq(autorolesTable.guildId, interaction.guildId!),
      eq(autorolesTable.roleId, role.id)
    ),
  });

  if (existing) {
    await interaction.reply({ content: `De rol **${role.name}** is al een autorole.`, ephemeral: true });
    return;
  }

  await db.insert(autorolesTable).values({
    guildId: interaction.guildId!,
    roleId: role.id,
    roleName: role.name,
  });

  await interaction.reply({ content: `✅ Nieuwe gasten krijgen nu automatisch de rol **${role.name}**.`, ephemeral: true });
}

export async function handleAutoroleVerwijderen(interaction: ChatInputCommandInteraction) {
  const role = interaction.options.getRole("rol", true);

  const deleted = await db.delete(autorolesTable)
    .where(and(
      eq(autorolesTable.guildId, interaction.guildId!),
      eq(autorolesTable.roleId, role.id)
    ))
    .returning();

  if (!deleted.length) {
    await interaction.reply({ content: `De rol **${role.name}** was geen autorole.`, ephemeral: true });
    return;
  }

  await interaction.reply({ content: `✅ De autorole **${role.name}** is verwijderd.`, ephemeral: true });
}

export async function handleAutoroleLijst(interaction: ChatInputCommandInteraction) {
  const roles = await db.query.autorolesTable.findMany({
    where: eq(autorolesTable.guildId, interaction.guildId!),
  });

  const embed = new EmbedBuilder()
    .setColor(HOTEL_GOLD)
    .setTitle("🔖 Autoroles")
    .setDescription(
      roles.length
        ? roles.map(r => `• @${r.roleName}`).join("\n")
        : "Er zijn nog geen autoroles geconfigureerd."
    )
    .setFooter({ text: "Hotel Toegangssysteem" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export async function applyAutoroles(member: GuildMember) {
  try {
    const roles = await db.query.autorolesTable.findMany({
      where: eq(autorolesTable.guildId, member.guild.id),
    });

    for (const r of roles) {
      const role = member.guild.roles.cache.get(r.roleId);
      if (role) await member.roles.add(role).catch(() => {});
    }
  } catch (err) {
    logger.error({ err }, "Autorole error");
  }
}
