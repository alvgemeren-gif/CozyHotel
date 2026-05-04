import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const embedCommands = [
  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Maak een aangepaste embed aan")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) =>
      opt.setName("titel").setDescription("Titel van de embed").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("beschrijving").setDescription("Inhoud van de embed").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("kleur")
        .setDescription("Kleur (hex, bijv. #D4AF37). Standaard: goud")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("afbeelding").setDescription("URL van een afbeelding").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("thumbnail").setDescription("URL van een thumbnail (klein rechts)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("footer").setDescription("Footer tekst").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("embed-bewerk")
    .setDescription("Bewerk een bestaande embed van de bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((opt) =>
      opt.setName("bericht-id").setDescription("ID van het bericht met de embed").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("titel").setDescription("Nieuwe titel (laat leeg = ongewijzigd)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt
        .setName("beschrijving")
        .setDescription("Nieuwe beschrijving. Gebruik Shift+Enter in Discord voor meerdere regels.")
        .setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("kleur").setDescription("Nieuwe kleur (hex)").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("afbeelding").setDescription("Nieuwe afbeelding URL").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("thumbnail").setDescription("Nieuwe thumbnail URL").setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName("footer").setDescription("Nieuwe footer tekst").setRequired(false)
    ),
];
