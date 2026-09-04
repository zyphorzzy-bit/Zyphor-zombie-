const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  UserSelectMenuBuilder,
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, enterState } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildBans
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      config: {
        ownerId: '',
        staffRoleId: '',
        generalSupportRoleId: '',
        logsChannelId: '',
        streamerChannelId: '',
        voiceChannelId: '',
        supportServerLink: 'https://discord.gg/seu-link-aqui',
        banBannerUrl: '',
        banAvatarUrl: '',
        candidaturas: {
          pendentesChannelId: '',
          aceitasChannelId: '',
          recusadasChannelId: '',
          cargoAprovadoId: ''
        },
        warnRoles: { warn1: '', warn2: '', warn3: '' }
      },
      users: {},
      teams: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const EMOJIS = {
  zyphor: '<:zyphor:1540096483276095621>',
  vermelho: '<:vermelho:1540096477689290842>',
  verde: '<:verde:1540096479501357137>',
  amarelo: '<:amarelo:1540096480998596741>',
  alerta: '<:alerta:1534611993410015456>',
  proibido: '<:Proibido:1534611991929290877>',
  protecao: '<:proteo:1539124701232898111>',
  suporte: '<:suporte:1539845832004870154>',
  atender: '<:atender:1541318084210720799>',
  fechar: '<:fechar:1541318085435199569>',
  aceitar: '<:aceitar:1539124696912756767>',
  recusar: '<:recusar:1539124698338566257>',
  config: '<:config:1534611990633250937>',
  user: '<:user:1539125800907968603>',
  users: '<:users:1539124702407168062>'
};

async function sendLog(guild, embed) {
  const data = loadData();
  if (!data.config.logsChannelId) return;
  const channel = guild.channels.cache.get(data.config.logsChannelId);
  if (channel) {
    await channel.send({ embeds: [embed] }).catch(() => null);
  }
}

async function sendPunishmentDM(user, title, reason, data) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`${reason}\n\nCaso queira contestar, acesse nosso servidor de suporte:`)
      .setColor('#ff0000')
      .setTimestamp();

    if (data.config.banBannerUrl) embed.setImage(data.config.banBannerUrl);
    if (data.config.banAvatarUrl) embed.setThumbnail(data.config.banAvatarUrl);

    const components = [];
    if (data.config.supportServerLink) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Servidor de Suporte / Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL(data.config.supportServerLink)
      );
      components.push(row);
    }

    await user.send({ embeds: [embed], components }).catch(() => null);
  } catch (err) {
    console.error('Erro ao enviar DM:', err);
  }
}

async function connectVoiceChannel(guild, channelId) {
  try {
    const connection = joinVoiceChannel({
      channelId: channelId,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          enterState(connection, VoiceConnectionStatus.Signalling, 5_000),
          enterState(connection, VoiceConnectionStatus.Connecting, 5_000)
        ]);
      } catch (e) {
        connection.destroy();
        setTimeout(() => connectVoiceChannel(guild, channelId), 5000);
      }
    });
  } catch (err) {
    console.error('Erro ao conectar na call:', err);
  }
}

client.once('ready', async () => {
  console.log(`${EMOJIS.zyphor} Bot Zyphor Zombie totalmente operacional!`);

  const data = loadData();
  if (data.config.voiceChannelId) {
    client.guilds.cache.forEach(guild => {
      const channel = guild.channels.cache.get(data.config.voiceChannelId);
      if (channel && channel.type === ChannelType.GuildVoice) {
        connectVoiceChannel(guild, channel.id);
      }
    });
  }
});

// Marcação temporária na entrada e Kick automático em 1 hora
client.on('guildMemberAdd', async (member) => {
  const data = loadData();

  const pendentesChannelId = data.config.candidaturas.pendentesChannelId;
  if (pendentesChannelId) {
    const channel = member.guild.channels.cache.get(pendentesChannelId);
    if (channel) {
      const msg = await channel.send({
        content: `👋 Fala ${member}! Você tem exatamente **1 hora** para se candidatar/negociar no painel abaixo, caso contrário será removido do servidor!`
      }).catch(() => null);

      if (msg) {
        setTimeout(() => msg.delete().catch(() => null), 30 * 1000);
      }
    }
  }

  setTimeout(async () => {
    try {
      const currentMember = await member.guild.members.fetch(member.id).catch(() => null);
      if (!currentMember) return;

      if (!data.users[member.id]?.verified) {
        const multiLangReason = 
          "⚠️ **Você foi removido por não concluir a verificação a tempo / You were kicked for not completing verification in time:**\n\n" +
          "🇧🇷 **PT:** Você tinha até 1 hora para enviar sua candidatura/negociação para liberar acesso ao servidor.\n" +
          "🇺🇸 **EN:** You had up to 1 hour to submit your application/negotiation to gain access to the server.\n" +
          "🇪🇸 **ES:** Tenías hasta 1 hora para enviar tu solicitud/negociación para acceder al servidor.\n" +
          "🇷🇺 **RU:** У вас было до 1 часа, чтобы отправить заявку/переговоры для доступа к серверу.\n" +
          "🇫🇷 **FR:** Vous aviez jusqu'à 1 heure pour soumettre votre candidature/négociation.";

        await sendPunishmentDM(member.user, 'Tempo Limite Excedido / Verification Timeout', multiLangReason, data);
        await currentMember.kick('Não preencheu a candidatura dentro do prazo de 1 hora.').catch(() => null);

        const logEmbed = new EmbedBuilder()
          .setTitle(`${EMOJIS.proibido} Membro Expulso (Tempo Limite)`)
          .setDescription(`**Usuário:** ${member.user.tag} (${member.id})\n**Motivo:** Sem candidatura em 1 hora.`)
          .setColor('#ff0000')
          .setTimestamp();

        await sendLog(member.guild, logEmbed);
      }
    } catch (e) {
      console.error('Erro no timer de expulsão:', e);
    }
  }, 60 * 60 * 1000);
});

// Presença de Live/Streamer
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence || !newPresence.user || newPresence.user.bot) return;

  const data = loadData();
  if (!data.config.streamerChannelId) return;

  const streamingActivity = newPresence.activities.find(act => act.type === 1);
  if (streamingActivity) {
    const channel = newPresence.guild.channels.cache.get(data.config.streamerChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle(`🟣 Streamer Ao Vivo: ${newPresence.user.tag}`)
      .setDescription(`**Título:** ${streamingActivity.details || 'Transmissão'}\n**Jogo:** ${streamingActivity.state || 'Geral'}\n\n[Assistir a Live](${streamingActivity.url})`)
      .setColor('#800080')
      .setThumbnail(newPresence.user.displayAvatarURL())
      .setTimestamp();

    await channel.send({ content: `${EMOJIS.zyphor} @everyone **Streamer Online!**`, embeds: [embed] }).catch(() => null);
  }
});

// Comandos
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const data = loadData();
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const isOwner = message.author.id === (data.config.ownerId || message.guild.ownerId);

  if (command === '.call') {
    if (!isOwner) return message.reply(`${EMOJIS.proibido} Apenas o Dono pode definir a call 24/7.`);

    let voiceChannel = message.member.voice.channel;
    if (args[0]) voiceChannel = message.guild.channels.cache.get(args[0]);

    if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
      return message.reply(`${EMOJIS.alerta} Entre em um canal de voz ou informe um ID válido! Uso: \`.call ID_DO_CANAL\``);
    }

    data.config.voiceChannelId = voiceChannel.id;
    saveData(data);

    await connectVoiceChannel(message.guild, voiceChannel.id);
    return message.reply(`${EMOJIS.verde} Conectado 24/7 no canal **${voiceChannel.name}**!`);
  }

  if (command === '.config') {
    if (!isOwner) return message.reply(`${EMOJIS.proibido} Apenas o Dono pode acessar.`);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.config} Configurações Gerais (Select Menus)`)
      .setDescription('Selecione os cargos e canais abaixo sem digitar IDs:')
      .setColor('#808080');

    const rowPendentes = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder().setCustomId('cfg_channel_pendentes').setPlaceholder('Canal de Negociações/Pendentes').setChannelTypes(ChannelType.GuildText)
    );

    const rowLogs = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder().setCustomId('cfg_channel_logs').setPlaceholder('Canal de Logs').setChannelTypes(ChannelType.GuildText)
    );

    const rowStaffRole = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder().setCustomId('cfg_role_staff').setPlaceholder('Cargo de Staff')
    );

    await message.channel.send({ embeds: [embed], components: [rowPendentes, rowLogs, rowStaffRole] });
  }

  if (command === '.candidatura') {
    if (!isOwner) return message.reply(`${EMOJIS.proibido} Apenas o Dono pode enviar este painel.`);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.user} Central de Negociação / Entrada`)
      .setDescription('Clique no botão abaixo para preencher o formulário de candidatura/negociação.')
      .setColor('#808080');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_open_negociacao_modal').setLabel('Negociar / Verificar').setStyle(ButtonStyle.Secondary).setEmoji(EMOJIS.verde)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
  }

  if (command === '.setup-ticket') {
    if (!isOwner) return message.reply(`${EMOJIS.proibido} Apenas o Dono pode configurar.`);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.suporte} Central de Atendimento & Suporte`)
      .setDescription('Selecione seu idioma para abrir um chamado individual com a equipe.')
      .setColor('#808080');

    const langMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_select_lang')
        .setPlaceholder('Escolha o seu idioma / Select your language')
        .addOptions([
          { label: 'Brasil / Português', value: 'pt', emoji: '🇧🇷' },
          { label: 'United States / English', value: 'en', emoji: '🇺🇸' },
          { label: 'Espanha / Español', value: 'es', emoji: '🇪🇸' },
          { label: 'Rússia / Русский', value: 'ru', emoji: '🇷🇺' },
          { label: 'França / Français', value: 'fr', emoji: '🇫🇷' }
        ])
    );

    await message.channel.send({ embeds: [embed], components: [langMenu] });
  }
});

// Interações
client.on('interactionCreate', async (interaction) => {
  const data = loadData();

  if (interaction.isChannelSelectMenu()) {
    if (interaction.customId === 'cfg_channel_pendentes') {
      data.config.candidaturas.pendentesChannelId = interaction.values[0];
      saveData(data);
      return interaction.reply({ content: `${EMOJIS.verde} Canal de Pendentes configurado!`, ephemeral: true });
    }
    if (interaction.customId === 'cfg_channel_logs') {
      data.config.logsChannelId = interaction.values[0];
      saveData(data);
      return interaction.reply({ content: `${EMOJIS.verde} Canal de Logs configurado!`, ephemeral: true });
    }
  }

  if (interaction.isRoleSelectMenu() && interaction.customId === 'cfg_role_staff') {
    data.config.staffRoleId = interaction.values[0];
    saveData(data);
    return interaction.reply({ content: `${EMOJIS.verde} Cargo de Staff configurado!`, ephemeral: true });
  }

  if (interaction.isButton() && interaction.customId === 'btn_open_negociacao_modal') {
    const modal = new ModalBuilder().setCustomId('modal_negociacao_submit').setTitle('Formulário de Negociação');

    const inputComoConheceu = new TextInputBuilder().setCustomId('input_onde_encontrou').setLabel('Como encontrou a gente?').setStyle(TextInputStyle.Short).setRequired(true);
    const inputMotivo = new TextInputBuilder().setCustomId('input_motivo').setLabel('Motivo de querer negociar conosco?').setStyle(TextInputStyle.Paragraph).setRequired(true);
    const inputPais = new TextInputBuilder().setCustomId('input_pais').setLabel('Qual o seu País/Nacionalidade?').setStyle(TextInputStyle.Short).setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(inputComoConheceu),
      new ActionRowBuilder().addComponents(inputMotivo),
      new ActionRowBuilder().addComponents(inputPais)
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'modal_negociacao_submit') {
    const ondeEncontrou = interaction.fields.getTextInputValue('input_onde_encontrou');
    const motivo = interaction.fields.getTextInputValue('input_motivo');
    const pais = interaction.fields.getTextInputValue('input_pais');

    if (!data.users[interaction.user.id]) data.users[interaction.user.id] = {};
    data.users[interaction.user.id].verified = true;
    saveData(data);

    const pendentesChannelId = data.config.candidaturas.pendentesChannelId;
    if (!pendentesChannelId) return interaction.reply({ content: `${EMOJIS.proibido} Canal de pendentes não configurado pelo Dono!`, ephemeral: true });

    const pendentesChannel = interaction.guild.channels.cache.get(pendentesChannelId);
    if (!pendentesChannel) return interaction.reply({ content: `${EMOJIS.proibido} Canal de pendentes não encontrado.`, ephemeral: true });

    await interaction.deferReply({ ephemeral: true });

    const thread = await pendentesChannel.threads.create({
      name: `negociacao-${interaction.user.username}`,
      autoArchiveDuration: 1440,
      type: ChannelType.PrivateThread,
      reason: 'Nova solicitação de negociação'
    });

    const staffRoleId = data.config.staffRoleId;
    if (staffRoleId) await thread.members.add(staffRoleId).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`${EMOJIS.user} Negociação / Candidatura - ${interaction.user.tag}`)
      .addFields(
        { name: 'Membro', value: `${interaction.user} (${interaction.user.id})`, inline: false },
        { name: 'País / Nacionalidade', value: pais, inline: true },
        { name: 'Como conheceu', value: ondeEncontrou, inline: true },
        { name: 'Motivo', value: motivo, inline: false }
      )
      .setColor('#808080')
      .setTimestamp();

    const rowAcao = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`neg_aceitar_${interaction.user.id}`).setLabel('Aceitar').setStyle(ButtonStyle.Secondary).setEmoji(EMOJIS.aceitar),
      new ButtonBuilder().setCustomId(`neg_recusar_${interaction.user.id}_${encodeURIComponent(pais)}`).setLabel('Recusar (Kick)').setStyle(ButtonStyle.Secondary).setEmoji(EMOJIS.recusar)
    );

    await thread.send({ content: `${interaction.user} ${staffRoleId ? `<@&${staffRoleId}>` : ''}`, embeds: [embed], components: [rowAcao] });
    return interaction.editReply({ content: `${EMOJIS.verde} Seus dados foram enviados no tópico privado!` });
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith('neg_aceitar_')) {
      await interaction.reply({ content: `${EMOJIS.verde} Negociação aprovada por ${interaction.user}!` });
      setTimeout(() => interaction.channel.delete().catch(() => null), 3000);
    }

    if (interaction.customId.startsWith('neg_recusar_')) {
      const parts = interaction.customId.split('_');
      const targetUserId = parts[2];
      const pais = decodeURIComponent(parts[3] || 'Geral');

      const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

      if (targetMember) {
        const kickMsg = `⚠️ **Sua solicitação de negociação/candidatura foi recusada**\n\nPaís informado: ${pais}\nSua entrada foi analisada e recusada pela equipe.`;
        await sendPunishmentDM(targetMember.user, 'Negociação Recusada / Refused', kickMsg, data);
        await targetMember.kick('Negociação recusada pela equipe').catch(() => null);
      }

      await interaction.reply({ content: `${EMOJIS.fechar} Recusado. Membro notificado e expulso do servidor.` });
      setTimeout(() => interaction.channel.delete().catch(() => null), 3000);
    }
  }
});

client.login(process.env.DISCORD_TOKEN || 'SEU_TOKEN_AQUI');
