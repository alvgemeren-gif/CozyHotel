import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const roleMenuCommands = [
  new SlashCommandBuilder()
    .setName("rollen-menu")
    .setDescription("Maak een klikbaar rollenmenu met een dropdown")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption((opt) =>
      opt.setName("titel").setDescription("Titel van het rollenmenu").setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName("rol1").setDescription("Rol 1").setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName("rol2").setDescription("Rol 2").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol3").setDescription("Rol 3").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol4").setDescription("Rol 4").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol5").setDescription("Rol 5").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol6").setDescription("Rol 6").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol7").setDescription("Rol 7").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol8").setDescription("Rol 8").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol9").setDescription("Rol 9").setRequired(false)
    )
    .addRoleOption((opt) =>
      opt.setName("rol10").setDescription("Rol 10").setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Beschrijving onder de titel")
        .setRequired(false)
    ),
];
