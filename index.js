const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  PermissionsBitField,
  SlashCommandBuilder,
  ActivityType
} = require("discord.js");

require("dotenv").config();
const fs = require("fs");

/* =========================================================
   ZYPHOR ZOMBIE
========================================================= */

const TOKEN = process.env.TOKEN;

const DONO = "1533306874513068093";

const DATA_FILE = "./data.json";

/* =========================================================
   EMOJIS
========================================================= */

const E = {
  aceito: "<:aceito:1539124707222093915>",
  pendente: "<:pendente:1539124705167147059>",
  recusado: "<:recusado:1539124703992614912>",
  horario: "<:horrio:1534611997335883886>",
  ID: "<:ID:1534611999085039786>",
  user: "<:user:1539125800907968603>",
  proibido: "<:Proibido:1534611991929290877>",
  protecao: "<:proteo:1534611994353602732>",
  warn: "<:warn:1539125781320433724>",
  alerta: "<:alerta:1534611993410015456>",
  arquivo: "<:arquivo:1539124693460713552>",
  aceitar: "<:aceitar:1539124696912756767>",
  recusar: "<:recusar:1539124698338566257>",
  linkexterno: "<:linkexterno:1539124690709385330>",
  config: "<:config:1534611990633250937>",
  ativado: "<a:ativado:1534611985260609607>",
  desativado: "<a:desativado:1534611986539876463>",

  Community: "<:Community:1544896843765391400>",
  membroKick: "<:Icon_Member_Kick:1544896833065717833>",
  membroPendente: "<:Icon_Member_Pending:1544896829383123017>",
  membroWarn: "<:Icon_Member_Warn:1544896827671842899>",
  poll: "<:Icon_Poll:1544896824253481140>",
  settings: "<:Icon_Settings:1544896822076645396>",
  location: "<:Location:1544896816393232404>",
  secured: "<:Secured:1544896839982125127>",
  security: "<:Security:1544896817915887691>",
  aceito2: "<:aceito:1544896848131526749>",
  achar: "<:achar:1544896842209165334>",
  anonimo: "<:annimo:1544896820864491561>",
  digitar: "<:digitar:1544896834449707038>",
  exclamao: "<:exclamao:1544896836391804938>",
  horario2: "<:horrio:1544896819522314292>",
  mais: "<:mais:1544896846483292200>",
  membrosOnline: "<:membroson:1544896849284964362>",
  texto: "<:texto:1544896845011091506>",
  w_cvs: "<:w_cvs:1544896838061269093>"
};

/* =========================================================
   BANCO
========================================================= */

let db = {
  guilds: {},
  candidates: {},
  tickets: {},
  warns: {},
  logs: {}
};

function carregarDB() {
  if (!fs.existsSync(DATA_FILE)) {
    salvarDB();
    return;
  }

  try {
    const dados = fs.readFileSync(DATA_FILE, "utf8");

    if (dados.trim()) {
      db = JSON.parse(dados);
    }
  } catch (err) {
    console.log("Erro ao carregar data.json.");
    console.log(err);
  }
}

function salvarDB() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(db, null, 2),
    "utf8"
  );
}

carregarDB();

/* =========================================================
   CONFIG PADRÃO
========================================================= */

function getConfig(guildId) {

  if (!db.guilds[guildId]) {

    db.guilds[guildId] = {

      candidatura: {
        canal: null,
        pendentes: null,
        aceitos: null,
        recusados: null,
        cargoEquipe: null,
        cargoAprovado: null,
        idadeMinima: 7
      },

      ticket: {
        ativo: false,
        categoria: null,
        canalPainel: null,
        fecharEquipe: true,
        suporte: {
          BR: [],
          US: [],
          RU: [],
          ES: [],
          PT: []
        }
      },

      moderacao: {
        antiLink: false,
        antiSpam: false,
        antiFlood: false,
        antiBot: false,
        antiRaid: false,
        antiSelfBot: false,
        warn1: null,
        warn2: null,
        warn3: null
      },

      logs: {
        geral: null,
        seguranca: null,
        moderacao: null,
        tickets: null,
        candidaturas: null
      },

      alerta: {
        canal: null
      },

      voz: {
        ativo: false,
        canal: null
      },

      streaming: {
        ativo: true,
        nome: "zyphor zombie"
      },

      lider: {
        cargo: null
      },

      traducao: {
        ativo: false
      }

    };

    salvarDB();
  }

  return db.guilds[guildId];
}

/* =========================================================
   VERIFICAÇÕES
========================================================= */

function isDono(userId) {
  return String(userId) === DONO;
}

function isEquipe(member) {

  if (!member) return false;

  const cfg = getConfig(member.guild.id);

  if (!cfg.candidatura.cargoEquipe) {
    return false;
  }

  return member.roles.cache.has(
    cfg.candidatura.cargoEquipe
  );
}

function isLider(member) {

  if (!member) return false;

  const cfg = getConfig(member.guild.id);

  if (!cfg.lider.cargo) {
    return false;
  }

  return member.roles.cache.has(
    cfg.lider.cargo
  );
}

/* =========================================================
   CLIENT
========================================================= */

const client = new Client({

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],

  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User
  ]

});

/* =========================================================
   EMBED DE CANDIDATURA
========================================================= */

function embedCandidatura(user, motivo) {

  const dias = Math.floor(
    (Date.now() - user.createdTimestamp) / 86400000
  );

  return new EmbedBuilder()

    .setTitle(
      `${E.membroPendente} CANDIDATURA PENDENTE`
    )

    .setThumbnail(
      user.displayAvatarURL({
        size: 512,
        dynamic: true
      })
    )

    .addFields(

      {
        name: `${E.user} Usuário`,
        value:
          `${user}\n` +
          `\`${user.username}\``,
        inline: true
      },

      {
        name: `${E.ID} ID`,
        value:
          `\`${user.id}\``,
        inline: true
      },

      {
        name: `${E.horario} Conta criada`,
        value:
          `<t:${Math.floor(
            user.createdTimestamp / 1000
          )}:F>\n` +
          `Há ${dias} dias`,
        inline: false
      },

      {
        name: `${E.texto} Motivo`,
        value:
          motivo?.slice(0, 1024) ||
          "Nenhum motivo informado.",
        inline: false
      }

    )

    .setFooter({
      text: "zyphor zombie • Sistema de candidaturas"
    })

    .setTimestamp();
}

/* =========================================================
   LOGS
========================================================= */

async function enviarLog(guild, tipo, texto) {

  const cfg = getConfig(guild.id);

  let canalId = null;

  if (tipo === "seguranca") {
    canalId = cfg.logs.seguranca;
  }

  if (tipo === "moderacao") {
    canalId = cfg.logs.moderacao;
  }

  if (tipo === "ticket") {
    canalId = cfg.logs.tickets;
  }

  if (tipo === "candidatura") {
    canalId = cfg.logs.candidaturas;
  }

  if (!canalId) {
    canalId = cfg.logs.geral;
  }

  if (!canalId) return;

  const canal = guild.channels.cache.get(canalId);

  if (!canal) return;

  try {

    await canal.send({
      embeds: [
        new EmbedBuilder()
          .setDescription(texto)
          .setTimestamp()
      ]
    });

  } catch {}
}

/* =========================================================
   BOTÕES DE CANDIDATURA
========================================================= */

class BotoesCandidatura {

  static criar(id) {

    return new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId(`cand_aceitar_${id}`)
          .setLabel("Aceitar")
          .setEmoji(E.aceitar)
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`cand_recusar_${id}`)
          .setLabel("Recusar")
          .setEmoji(E.recusar)
          .setStyle(ButtonStyle.Secondary)

      );
  }
}

/* =========================================================
   PAINEL CONFIG
========================================================= */

function painelConfig(guild) {

  const cfg = getConfig(guild.id);

  const candidatura =
    cfg.candidatura.canal
      ? E.ativado
      : E.desativado;

  const ticket =
    cfg.ticket.ativo
      ? E.ativado
      : E.desativado;

  return new EmbedBuilder()

    .setTitle(
      `${E.settings} CONFIGURAÇÃO — ZYPHOR ZOMBIE`
    )

    .setDescription(

      `${E.secured} **Painel administrativo**\n\n` +

      `${E.membroPendente} Candidaturas: ${candidatura}\n` +

      `${E.Community} Tickets: ${ticket}\n` +

      `${E.security} Segurança: ${
        cfg.logs.seguranca
          ? E.ativado
          : E.desativado
      }\n` +

      `${E.membroWarn} Moderação: ${
        cfg.moderacao.antiLink ||
        cfg.moderacao.antiSpam
          ? E.ativado
          : E.desativado
      }\n\n` +

      `Selecione uma opção abaixo para configurar.`

    )

    .setTimestamp()

    .setFooter({
      text: "zyphor zombie • Apenas o dono pode configurar"
    });
}

/* =========================================================
   MENU CONFIG
========================================================= */

function menuConfig() {

  const menu =
    new StringSelectMenuBuilder()

      .setCustomId("config_menu")

      .setPlaceholder(
        "⚙️ Escolha o sistema"
      )

      .addOptions(

        new StringSelectMenuOptionBuilder()
          .setLabel("Candidaturas")
          .setDescription(
            "Configurar sistema de candidaturas."
          )
          .setValue("candidatura")
          .setEmoji(E.membroPendente),

        new StringSelectMenuOptionBuilder()
          .setLabel("Tickets")
          .setDescription(
            "Configurar tickets e países."
          )
          .setValue("ticket")
          .setEmoji(E.Community),

        new StringSelectMenuOptionBuilder()
          .setLabel("Moderação")
          .setDescription(
            "Anti-link, spam, warns e punições."
          )
          .setValue("moderacao")
          .setEmoji(E.membroWarn),

        new StringSelectMenuOptionBuilder()
          .setLabel("Segurança")
          .setDescription(
            "Proteções e segurança."
          )
          .setValue("seguranca")
          .setEmoji(E.security),

        new StringSelectMenuOptionBuilder()
          .setLabel("Logs")
          .setDescription(
            "Configurar canais de logs."
          )
          .setValue("logs")
          .setEmoji(E.arquivo),

        new StringSelectMenuOptionBuilder()
          .setLabel("Cargos")
          .setDescription(
            "Configurar cargos."
          )
          .setValue("cargos")
          .setEmoji(E.mais),

        new StringSelectMenuOptionBuilder()
          .setLabel("Líder")
          .setDescription(
            "Configurar cargo de líder."
          )
          .setValue("lider")
          .setEmoji(E.Community),

        new StringSelectMenuOptionBuilder()
          .setLabel("Streaming")
          .setDescription(
            "Configurar presença."
          )
          .setValue("streaming")
          .setEmoji(E.w_cvs),

        new StringSelectMenuOptionBuilder()
          .setLabel("Canal de Voz")
          .setDescription(
            "Configurar canal de voz."
          )
          .setValue("voz")
          .setEmoji(E.horario2)

      );

  return new ActionRowBuilder()
    .addComponents(menu);
}

/* =========================================================
   COMANDOS
========================================================= */

const comandos = [

  new SlashCommandBuilder()
    .setName("config")
    .setDescription(
      "Configura o zyphor zombie."
    ),

  new SlashCommandBuilder()
    .setName("painel")
    .setDescription(
      "Mostra o painel do servidor."
    ),

  new SlashCommandBuilder()
    .setName("alerta")
    .setDescription(
      "Envia um alerta."
    )
    .addStringOption(option =>
      option
        .setName("mensagem")
        .setDescription(
          "Mensagem do alerta."
        )
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName("canal")
        .setDescription(
          "Canal do alerta."
        )
        .addChannelTypes(
          ChannelType.GuildText
        )
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("traduzir")
    .setDescription(
      "Traduz uma mensagem."
    )
    .addStringOption(option =>
      option
        .setName("mensagem")
        .setDescription(
          "Mensagem para traduzir."
        )
        .setRequired(true)
    )

].map(x => x.toJSON());

/* =========================================================
   INTERAÇÕES
========================================================= */

client.on(
  "interactionCreate",
  async interaction => {

    try {

      /* ===============================
         /CONFIG
      =============================== */

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "config"
      ) {

        if (!isDono(interaction.user.id)) {

          return interaction.reply({
            content:
              `${E.proibido} Você não tem permissão para usar o /config.`,
            ephemeral: true
          });

        }

        return interaction.reply({
          embeds: [
            painelConfig(interaction.guild)
          ],
          components: [
            menuConfig()
          ],
          ephemeral: true
        });
      }

      /* ===============================
         /PAINEL
      =============================== */

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "painel"
      ) {

        const guild = interaction.guild;

        const membros =
          guild.memberCount;

        const bots =
          guild.members.cache.filter(
            m => m.user.bot
          ).size;

        const cfg =
          getConfig(guild.id);

        const embed =
          new EmbedBuilder()

            .setTitle(
              `${E.settings} PAINEL — ZYPHOR ZOMBIE`
            )

            .setDescription(
              `${E.Community} **Servidor:** ${guild.name}\n` +
              `${E.ID} **ID:** \`${guild.id}\`\n\n` +

              `${E.membrosOnline} **Membros:** ${membros}\n` +
              `🤖 **Bots:** ${bots}\n\n` +

              `${E.membroPendente} **Candidaturas:** ${
                cfg.candidatura.canal
                  ? E.ativado
                  : E.desativado
              }\n` +

              `${E.Community} **Tickets:** ${
                cfg.ticket.ativo
                  ? E.ativado
                  : E.desativado
              }`
            )

            .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          ephemeral: true
        });
      }

      /* ===============================
         /ALERTA
      =============================== */

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "alerta"
      ) {

        if (
          interaction.guild.ownerId !==
          interaction.user.id
        ) {

          return interaction.reply({
            content:
              `${E.proibido} Apenas o dono do servidor pode usar este comando.`,
            ephemeral: true
          });

        }

        const mensagem =
          interaction.options.getString(
            "mensagem"
          );

        const canal =
          interaction.options.getChannel(
            "canal"
          );

        const embed =
          new EmbedBuilder()

            .setTitle(
              `${E.alerta} ALERTA`
            )

            .setDescription(
              mensagem
            )

            .setFooter({
              text:
                `Enviado por ${interaction.user.username}`
            })

            .setTimestamp();

        await canal.send({
          content: "@everyone",
          embeds: [embed]
        });

        return interaction.reply({
          content:
            `${E.aceito} Alerta enviado.`,
          ephemeral: true
        });
      }

      /* ===============================
         /TRADUZIR
      =============================== */

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "traduzir"
      ) {

        const mensagem =
          interaction.options.getString(
            "mensagem"
          );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                `${E.location} Tradução`
              )
              .setDescription(
                `Mensagem recebida:\n\n${mensagem}\n\n` +
                `Sistema de tradução configurável.`
              )
          ]
        });
      }

      /* ===============================
         MENU CONFIG
      =============================== */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "config_menu"
      ) {

        if (!isDono(interaction.user.id)) {

          return interaction.reply({
            content:
              `${E.proibido} Sem permissão.`,
            ephemeral: true
          });

        }

        const opcao =
          interaction.values[0];

        const cfg =
          getConfig(
            interaction.guild.id
          );

        /* ============================
           CANDIDATURAS
        ============================ */

        if (opcao === "candidatura") {

          const embed =
            new EmbedBuilder()

              .setTitle(
                `${E.membroPendente} CANDIDATURAS`
              )

              .setDescription(
                `${E.membroPendente} Canal de candidaturas:\n` +
                `${cfg.candidatura.canal
                  ? `<#${cfg.candidatura.canal}>`
                  : "Não configurado"}\n\n` +

                `${E.arquivo} Canal de pendentes:\n` +
                `${cfg.candidatura.pendentes
                  ? `<#${cfg.candidatura.pendentes}>`
                  : "Não configurado"}\n\n` +

                `${E.aceito} Canal de aceitos:\n` +
                `${cfg.candidatura.aceitos
                  ? `<#${cfg.candidatura.aceitos}>`
                  : "Não configurado"}\n\n` +

                `${E.recusado} Canal de recusados:\n` +
                `${cfg.candidatura.recusados
                  ? `<#${cfg.candidatura.recusados}>`
                  : "Não configurado"}`
              );

          const menu =
            new ChannelSelectMenuBuilder()

              .setCustomId(
                "config_candidatura_canal"
              )

              .setPlaceholder(
                "Selecione o canal de candidatura"
              )

              .setChannelTypes(
                ChannelType.GuildText
              );

          return interaction.update({
            embeds: [embed],
            components: [
              new ActionRowBuilder()
                .addComponents(menu)
            ]
          });
        }

        /* ============================
           TICKETS
        ============================ */

        if (opcao === "ticket") {

          const embed =
            new EmbedBuilder()

              .setTitle(
                `${E.Community} SISTEMA DE TICKETS`
              )

              .setDescription(
                `Configure o painel e os suportes por país.\n\n` +

                `🇧🇷 **Brasil**\n` +
                `🇺🇸 **Estados Unidos**\n` +
                `🇷🇺 **Rússia**\n` +
                `🇪🇸 **Espanha**\n` +
                `🇵🇹 **Portugal**`
              );

          const menu =
            new StringSelectMenuBuilder()

              .setCustomId(
                "ticket_pais"
              )

              .setPlaceholder(
                "🌎 Escolha o suporte"
              )

              .addOptions(

                {
                  label: "Brasil",
                  value: "BR",
                  emoji: "🇧🇷"
                },

                {
                  label: "Estados Unidos",
                  value: "US",
                  emoji: "🇺🇸"
                },

                {
                  label: "Rússia",
                  value: "RU",
                  emoji: "🇷🇺"
                },

                {
                  label: "Espanha",
                  value: "ES",
                  emoji: "🇪🇸"
                },

                {
                  label: "Portugal",
                  value: "PT",
                  emoji: "🇵🇹"
                }

              );

          return interaction.update({
            embeds: [embed],
            components: [
              new ActionRowBuilder()
                .addComponents(menu)
            ]
          });
        }

        /* ============================
           MODERAÇÃO
        ============================ */

        if (opcao === "moderacao") {

          const embed =
            new EmbedBuilder()

              .setTitle(
                `${E.membroWarn} MODERAÇÃO`
              )

              .setDescription(
                `${E.security} Configure os sistemas de proteção.\n\n` +

                `🔗 Anti-link: ${
                  cfg.moderacao.antiLink
                    ? E.ativado
                    : E.desativado
                }\n` +

                `💬 Anti-spam: ${
                  cfg.moderacao.antiSpam
                    ? E.ativado
                    : E.desativado
                }\n` +

                `🌊 Anti-flood: ${
                  cfg.moderacao.antiFlood
                    ? E.ativado
                    : E.desativado
                }\n` +

                `🤖 Anti-bot: ${
                  cfg.moderacao.antiBot
                    ? E.ativado
                    : E.desativado
                }\n\n` +

                `${E.membroWarn} Warn 1: ${
                  cfg.moderacao.warn1
                    ? `<@&${cfg.moderacao.warn1}>`
                    : "Não configurado"
                }\n` +

                `${E.membroWarn} Warn 2: ${
                  cfg.moderacao.warn2
                    ? `<@&${cfg.moderacao.warn2}>`
                    : "Não configurado"
                }\n` +

                `${E.membroWarn} Warn 3: ${
                  cfg.moderacao.warn3
                    ? `<@&${cfg.moderacao.warn3}>`
                    : "Não configurado"
                }\n\n` +

                `No 4º warn: **KICK**`
              );

          const menu =
            new StringSelectMenuBuilder()

              .setCustomId(
                "moderacao_menu"
              )

              .setPlaceholder(
                "🛡️ Escolha uma configuração"
              )

              .addOptions(

                {
                  label: "Anti-link",
                  value: "antiLink",
                  emoji: "🔗"
                },

                {
                  label: "Anti-spam",
                  value: "antiSpam",
                  emoji: "💬"
                },

                {
                  label: "Anti-flood",
                  value: "antiFlood",
                  emoji: "🌊"
                },

                {
                  label: "Anti-bot",
                  value: "antiBot",
                  emoji: "🤖"
                }

              );

          return interaction.update({
            embeds: [embed],
            components: [
              new ActionRowBuilder()
                .addComponents(menu)
            ]
          });
        }

        /* ============================
           SEGURANÇA
        ============================ */

        if (opcao === "seguranca") {

          return interaction.update({

            embeds: [

              new EmbedBuilder()

                .setTitle(
                  `${E.security} SEGURANÇA`
                )

                .setDescription(
                  `${E.secured} Sistema de segurança do servidor.\n\n` +
                  `Configure anti-raid, proteção e logs através dos menus.`
                )

            ],

            components: []

          });
        }

        /* ============================
           LOGS
        ============================ */

        if (opcao === "logs") {

          const menu =
            new ChannelSelectMenuBuilder()

              .setCustomId(
                "config_log_canal"
              )

              .setPlaceholder(
                "📁 Selecione o canal de logs"
              )

              .setChannelTypes(
                ChannelType.GuildText
              );

          return interaction.update({

            embeds: [

              new EmbedBuilder()

                .setTitle(
                  `${E.arquivo} LOGS`
                )

                .setDescription(
                  "Escolha o canal onde os logs serão enviados."
                )

            ],

            components: [
              new ActionRowBuilder()
                .addComponents(menu)
            ]

          });
        }

        /* ============================
           CARGOS
        ============================ */

        if (opcao === "cargos") {

          const menu =
            new RoleSelectMenuBuilder()

              .setCustomId(
                "config_cargo_equipe"
              )

              .setPlaceholder(
                "👮 Escolha o cargo da equipe"
              );

          return interaction.update({

            embeds: [

              new EmbedBuilder()

                .setTitle(
                  `${E.Community} CARGOS`
                )

                .setDescription(
                  "Selecione o cargo que fará parte da equipe."
                )

            ],

            components: [
              new ActionRowBuilder()
                .addComponents(menu)
            ]

          });
        }

        /* ============================
           LÍDER
        ============================ */

        if (opcao === "lider") {

          const menu =
            new RoleSelectMenuBuilder()

              .setCustomId(
                "config_lider"
              )

              .setPlaceholder(
                "👑 Escolha o cargo de líder"
              );

          return interaction.update({

            embeds: [

              new EmbedBuilder()

                .setTitle(
                  `${E.Community} LÍDER`
                )

                .setDescription(
                  "O cargo selecionado poderá usar o sistema de líder."
                )

            ],

            components: [
              new ActionRowBuilder()
                .addComponents(menu)
            ]

          });
        }

        /* ============================
           STREAMING
        ============================ */

        if (opcao === "streaming") {

          cfg.streaming.ativo =
            !cfg.streaming.ativo;

          cfg.streaming.nome =
            "zyphor zombie";

          salvarDB();

          client.user.setPresence({

            activities: cfg.streaming.ativo
              ? [
                  {
                    name: "zyphor zombie",
                    type:
                      ActivityType.Streaming,
                    url:
                      "https://www.twitch.tv/"
                  }
                ]
              : [],

            status: "online"

          });

          return interaction.update({

            embeds: [

              new EmbedBuilder()

                .setTitle(
                  `${E.w_cvs} STREAMING`
                )

                .setDescription(
                  `Streaming: ${
                    cfg.streaming.ativo
                      ? E.ativado
                      : E.desativado
                  }\n\n` +
                  `Nome: **zyphor zombie**`
                )

            ],

            components: []

          });
        }

        /* ============================
           VOZ
        ============================ */

        if (opcao === "voz") {

          const menu =
            new ChannelSelectMenuBuilder()

              .setCustomId(
                "config_voz"
              )

              .setPlaceholder(
                "🔊 Escolha o canal de voz"
              )

              .setChannelTypes(
                ChannelType.GuildVoice
              );

          return interaction.update({

            embeds: [

              new EmbedBuilder()

                .setTitle(
                  `${E.horario2} CANAL DE VOZ`
                )

                .setDescription(
                  "Escolha o canal de voz onde o bot ficará."
                )

            ],

            components: [
              new ActionRowBuilder()
                .addComponents(menu)
            ]

          });
        }

      }

      /* ===============================
         SELECT CANDIDATURA
      =============================== */

      if (
        interaction.isChannelSelectMenu() &&
        interaction.customId ===
          "config_candidatura_canal"
      ) {

        const cfg =
          getConfig(
            interaction.guild.id
          );

        cfg.candidatura.canal =
          interaction.values[0];

        salvarDB();

        return interaction.update({

          embeds: [

            new EmbedBuilder()

              .setTitle(
                `${E.aceito} CANAL CONFIGURADO`
              )

              .setDescription(
                `${E.membroPendente} Canal de candidatura definido para <#${interaction.values[0]}>`
              )

          ],

          components: []

        });
      }

      /* ===============================
         SELECT LOG
      =============================== */

      if (
        interaction.isChannelSelectMenu() &&
        interaction.customId ===
          "config_log_canal"
      ) {

        const cfg =
          getConfig(
            interaction.guild.id
          );

        cfg.logs.geral =
          interaction.values[0];

        salvarDB();

        return interaction.update({

          embeds: [

            new EmbedBuilder()

              .setTitle(
                `${E.arquivo} LOG CONFIGURADO`
              )

              .setDescription(
                `Logs serão enviados para <#${interaction.values[0]}>`
              )

          ],

          components: []

        });
      }

      /* ===============================
         SELECT VOZ
      =============================== */

      if (
        interaction.isChannelSelectMenu() &&
        interaction.customId ===
          "config_voz"
      ) {

        const cfg =
          getConfig(
            interaction.guild.id
          );

        cfg.voz.canal =
          interaction.values[0];

        cfg.voz.ativo =
          true;

        salvarDB();

        return interaction.update({

          embeds: [

            new EmbedBuilder()

              .setTitle(
                `${E.aceito} CANAL DE VOZ`
              )

              .setDescription(
                `Canal configurado: <#${interaction.values[0]}>`
              )

          ],

          components: []

        });
      }

      /* ===============================
         SELECT CARGO EQUIPE
      =============================== */

      if (
        interaction.isRoleSelectMenu() &&
        interaction.customId ===
          "config_cargo_equipe"
      ) {

        const cfg =
          getConfig(
            interaction.guild.id
          );

        cfg.candidatura.cargoEquipe =
          interaction.values[0];

        salvarDB();

        return interaction.update({

          embeds: [

            new EmbedBuilder()

              .setTitle(
                `${E.aceito} CARGO CONFIGURADO`
              )

              .setDescription(
                `Cargo da equipe: <@&${interaction.values[0]}>`
              )

          ],

          components: []

        });
      }

      /* ===============================
         SELECT LÍDER
      =============================== */

      if (
        interaction.isRoleSelectMenu() &&
        interaction.customId ===
          "config_lider"
      ) {

        const cfg =
          getConfig(
            interaction.guild.id
          );

        cfg.lider.cargo =
          interaction.values[0];

        salvarDB();

        return interaction.update({

          embeds: [

            new EmbedBuilder()

              .setTitle(
                `${E.aceito} LÍDER CONFIGURADO`
              )

              .setDescription(
                `Cargo de líder: <@&${interaction.values[0]}>`
              )

          ],

          components: []

        });
      }

      /* ===============================
         BOTÕES CANDIDATURA
      =============================== */

      if (
        interaction.isButton() &&
        interaction.customId.startsWith(
          "cand_"
        )
      ) {

        if (
          !isEquipe(
            interaction.member
          )
        ) {

          return interaction.reply({
            content:
              `${E.proibido} Apenas a equipe pode fazer isso.`,
            ephemeral: true
          });

        }

        const partes =
          interaction.customId.split("_");

        const acao =
          partes[1];

        const id =
          partes.slice(2).join("_");

        const candidatura =
          db.candidates[id];

        if (!candidatura) {

          return interaction.reply({
            content:
              `${E.warn} Candidatura não encontrada.`,
            ephemeral: true
          });

        }

        if (
          candidatura.status !==
          "pendente"
        ) {

          return interaction.reply({
            content:
              `${E.warn} Essa candidatura já foi analisada.`,
            ephemeral: true
          });

        }

        const membro =
          await interaction.guild.members
            .fetch(
              candidatura.userId
            )
            .catch(() => null);

        const cfg =
          getConfig(
            interaction.guild.id
          );

        if (acao === "aceitar") {

          candidatura.status =
            "aceito";

          candidatura.staff =
            interaction.user.id;

          if (
            membro &&
            cfg.candidatura.cargoAprovado
          ) {

            const cargo =
              interaction.guild.roles.cache
                .get(
                  cfg.candidatura.cargoAprovado
                );

            if (cargo) {
              await membro.roles
                .add(cargo)
                .catch(() => {});
            }

          }

          if (
            cfg.candidatura.aceitos
          ) {

            const canal =
              interaction.guild.channels.cache
                .get(
                  cfg.candidatura.aceitos
                );

            if (canal) {

              await canal.send({
                content:
                  `${E.aceito} ${membro || `<@${candidatura.userId}>`} foi aceito.`
              });

            }

          }

          await enviarLog(
            interaction.guild,
            "candidatura",
            `${E.aceito} **Candidatura aceita**\n` +
            `Usuário: <@${candidatura.userId}>\n` +
            `Staff: ${interaction.user}`
          );

          if (membro) {

            await membro.send(
              `${E.aceito} **Sua candidatura foi aceita!**\n` +
              `Bem-vindo(a) ao servidor.`
            ).catch(() => {});

          }

          salvarDB();

          return interaction.update({
            content:
              `${E.aceito} Candidatura aceita por ${interaction.user}.`,
            embeds: [],
            components: []
          });
        }

        if (acao === "recusar") {

          candidatura.status =
            "recusado";

          candidatura.staff =
            interaction.user.id;

          if (
            cfg.candidatura.recusados
          ) {

            const canal =
              interaction.guild.channels.cache
                .get(
                  cfg.candidatura.recusados
                );

            if (canal) {

              await canal.send({
                content:
                  `${E.recusado} ${membro || `<@${candidatura.userId}>`} teve a candidatura recusada.`
              });

            }

          }

          await enviarLog(
            interaction.guild,
            "candidatura",
            `${E.recusado} **Candidatura recusada**\n` +
            `Usuário: <@${candidatura.userId}>\n` +
            `Staff: ${interaction.user}`
          );

          if (membro) {

            await membro.send(
              `${E.recusado} **Sua candidatura foi recusada.**`
            ).catch(() => {});

          }

          salvarDB();

          return interaction.update({
            content:
              `${E.recusado} Candidatura recusada por ${interaction.user}.`,
            embeds: [],
            components: []
          });
        }
      }

    } catch (erro) {

      console.log(
        "Erro na interação:",
        erro
      );

      if (
        interaction.replied ||
        interaction.deferred
      ) {

        await interaction.followUp({
          content:
            `${E.warn} Ocorreu um erro ao executar essa ação.`,
          ephemeral: true
        }).catch(() => {});

      } else {

        await interaction.reply({
          content:
            `${E.warn} Ocorreu um erro ao executar essa ação.`,
          ephemeral: true
        }).catch(() => {});

      }

    }

  }
);

/* =========================================================
   NOVA CANDIDATURA
========================================================= */

client.on(
  "messageCreate",
  async message => {

    if (
      !message.guild ||
      message.author.bot
    ) {
      return;
    }

    const cfg =
      getConfig(
        message.guild.id
      );

    /* ===============================
       ANTI-LINK
    =============================== */

    if (
      cfg.moderacao.antiLink &&
      /(https?:\/\/|discord\.gg\/)/i
        .test(message.content)
    ) {

      if (
        !message.member.permissions.has(
          PermissionsBitField.Flags.ManageMessages
        )
      ) {

        await message.delete()
          .catch(() => {});

        await enviarLog(
          message.guild,
          "moderacao",
          `${E.proibido} Link removido de ${message.author}.`
        );

        return;
      }
    }

    /* ===============================
       CANDIDATURA
    =============================== */

    if (
      cfg.candidatura.canal &&
      message.channel.id ===
        cfg.candidatura.canal
    ) {

      const id =
        `${message.author.id}_${Date.now()}`;

      db.candidates[id] = {

        userId:
          message.author.id,

        guildId:
          message.guild.id,

        username:
          message.author.username,

        motivo:
          message.content,

        status:
          "pendente",

        staff:
          null,

        createdAt:
          Date.now()

      };

      salvarDB();

      let canalPendentes =
        cfg.candidatura.pendentes
          ? message.guild.channels.cache
              .get(
                cfg.candidatura.pendentes
              )
          : null;

      if (!canalPendentes) {
        canalPendentes =
          message.channel;
      }

      const thread =
        await canalPendentes.threads
          .create({

            name:
              `⏳-${message.author.username}`,

            type:
              ChannelType.PrivateThread,

            invitable:
              false

          })
          .catch(() => null);

      if (thread) {

        if (
          cfg.candidatura.cargoEquipe
        ) {

          await thread.members
            .add(
              cfg.candidatura.cargoEquipe
            )
            .catch(() => {});

        }

        await thread.send({

          embeds: [
            embedCandidatura(
              message.author,
              message.content
            )
          ],

          components: [
            BotoesCandidatura.criar(id)
          ]

        });

        db.candidates[id].thread =
          thread.id;

        salvarDB();

      }

      await message.delete()
        .catch(() => {});

      return;
    }

  }
);

/* =========================================================
   NOVO MEMBRO
========================================================= */

client.on(
  "guildMemberAdd",
  async member => {

    const cfg =
      getConfig(
        member.guild.id
      );

    if (
      cfg.moderacao.antiBot &&
      member.user.bot
    ) {

      await member.kick(
        "Anti-bot"
      ).catch(() => {});

      await enviarLog(
        member.guild,
        "seguranca",
        `${E.proibido} Bot removido automaticamente: ${member.user.tag}`
      );

      return;
    }

    if (
      cfg.moderacao.antiRaid
    ) {

      await enviarLog(
        member.guild,
        "seguranca",
        `${E.security} Novo membro entrou: ${member.user.tag}`
      );

    }

  }
);

/* =========================================================
   READY
========================================================= */

client.once(
  "ready",
  async () => {

    console.log(
      "===================================="
    );

    console.log(
      "☠️ zyphor zombie ONLINE"
    );

    console.log(
      `🤖 ${client.user.tag}`
    );

    console.log(
      "===================================="
    );

    try {

      await client.application.commands.set(
        comandos
      );

      console.log(
        "✅ Comandos registrados."
      );

    } catch (err) {

      console.log(
        "Erro ao registrar comandos:",
        err
      );

    }

    client.user.setPresence({

      activities: [
        {
          name:
            "zyphor zombie",
          type:
            ActivityType.Streaming,
          url:
            "https://www.twitch.tv/"
        }
      ],

      status:
        "online"

    });

  }
);

/* =========================================================
   PROTEÇÃO CONTRA SERVIDOR NÃO AUTORIZADO
========================================================= */

client.on(
  "guildCreate",
  async guild => {

    /*
      O bot não possui mais ID de servidor fixado.
      Se quiser bloquear servidores futuramente,
      essa verificação pode ser ativada aqui.
    */

    console.log(
      `Bot adicionado em: ${guild.name} (${guild.id})`
    );

  }
);

/* =========================================================
   TOKEN
========================================================= */

if (!TOKEN) {

  console.log(
    "❌ TOKEN não configurado."
  );

  process.exit(1);
}

client.login(TOKEN);
