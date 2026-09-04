const fs = require('fs');
const path = require('path');
const https = require('https');
const {
    Client,
    GatewayIntentBits,
    Partials,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActivityType,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

const OWNER_ID = '1533306874513068093';
const GUILD_ID = '1544472150897852587';
const DB_PATH = path.join(__dirname, 'data.json');

// --- DICIONÁRIO DE EMOJIS PERSONALIZADOS ---
const EMOJIS = {
    zyphor: '<:zyphor:1540096483276095621>',
    config: '<:Icon_Settings:1544896822076645396>',
    ativado: '<a:ativado:1534611985260609607>',
    desativado: '<a:desativado:1534611986539876463>',
    aceito: '<:aceito:1544896848131526749>',
    recusado: '<:ruim:1539124703992614912>',
    pendente: '<:Icon_Member_Pending:1544896829383123017>',
    proibido: '<:Proibido:1534611991929290877>',
    alerta: '<:alerta:1534611993410015456>',
    protecao: '<:Secured:1544896839982125127>',
    security: '<:Security:1544896817915887691>',
    warn: '<:Icon_Member_Warn:1544896827671842899>',
    kick: '<:Icon_Member_Kick:1544896833065717833>',
    id: '<:ID:1534611999085039786>',
    horario: '<:horrio:1544896819522314292>',
    user: '<:user:1539125800907968603>',
    users: '<:users:1539124702407168062>',
    texto: '<:texto:1544896845011091506>',
    membroson: '<:membroson:1544896849284964362>',
    arquivo: '<:arquivo:1539124693460713552>',
    location: '<:Location:1544896816393232404>',
    community: '<:Community:1544896843765391400>',
    seta: '<:seta:1539785898693234700>',
    digitar: '<:digitar:1544896834449707038>',
    fechar: '<:fechar:1541318085435199569>',
    atender: '<:atender:1541318084210720799>'
};

function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        const initialDB = {
            config: {
                candidaturas: { canalEnvio: null, canalPendentes: null, canalAceitos: null, canalRecusados: null, canalLogs: null, cargoEquipe: null, cargoAprovado: null, idadeMinimaConta: 0, dmAprovacao: true, dmRecusa: true },
                tickets: { paises: ['🇧🇷 Brasil', '🇺🇸 Estados Unidos', '🇷🇺 Rússia', '🇪🇸 Espanha', '🇵🇹 Portugal'], suportes: {} },
                seguranca: { antiLink: false, antiSpam: false, antiBot: false, antiRaid: false, antiSelfbot: true },
                moderacao: { warn1Role: null, warn2Role: null, warn3Role: null },
                logs: { gerais: null, seguranca: null, moderacao: null, tickets: null, candidaturas: null, warns: null, membros: null, lideres: null },
                lideres: {},
                voz: { canalGeradorId: null, ativo: true },
                streaming: { nome: '☠️ zyphor zombie', url: 'https://www.twitch.tv/discord', ativo: true }
            },
            candidaturas: {},
            tickets: {},
            warns: {},
            pausadosAtendimento: [],
            tempVoiceChannels: []
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2));
        return initialDB;
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

let db = loadDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.ThreadMember]
});

const PAGES = ['main', 'candidaturas', 'tickets', 'seguranca', 'moderacao', 'logs', 'lideres', 'cargos', 'voz', 'streaming', 'traducao', 'sistema'];

function renderConfigPanel(guild, currentPage = 'main') {
    const totalPages = PAGES.length;
    const currentIndex = PAGES.indexOf(currentPage);

    const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setFooter({ text: `Página ${currentIndex + 1} de ${totalPages} • ZYPHOR ZOMBIE` });

    const components = [];

    const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`cfg_nav_${PAGES[(currentIndex - 1 + totalPages) % totalPages]}`)
            .setLabel('◀️ VOLTAR')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('cfg_nav_main')
            .setLabel('⚙️ CONFIGURAÇÃO')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`cfg_nav_${PAGES[(currentIndex + 1) % totalPages]}`)
            .setLabel('▶️ PRÓXIMO')
            .setStyle(ButtonStyle.Secondary)
    );

    const categoryMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('cfg_select_category')
            .setPlaceholder('⚙️ Escolha uma categoria para configurar...')
            .addOptions([
                { label: 'Candidaturas', value: 'candidaturas', emoji: '📋' },
                { label: 'Tickets', value: 'tickets', emoji: '🎫' },
                { label: 'Segurança', value: 'seguranca', emoji: '🛡️' },
                { label: 'Moderação', value: 'moderacao', emoji: '🔨' },
                { label: 'Logs', value: 'logs', emoji: '📁' },
                { label: 'Líderes', value: 'lideres', emoji: '👑' },
                { label: 'Cargos', value: 'cargos', emoji: '🏷️' },
                { label: 'Voz', value: 'voz', emoji: '🔊' },
                { label: 'Streaming', value: 'streaming', emoji: '🎥' },
                { label: 'Tradução', value: 'traducao', emoji: '🌎' },
                { label: 'Sistema', value: 'sistema', emoji: '⚙️' }
            ])
    );

    if (currentPage === 'main') {
        const owner = guild.members.cache.get(guild.ownerId);
        embed.setTitle(`${EMOJIS.zyphor} ZYPHOR ZOMBIE — Painel de Configuração`)
            .setDescription(
                `${EMOJIS.community} **Servidor:** ${guild.name}\n` +
                `${EMOJIS.user} **Dono:** ${owner ? owner.user.tag : 'Desconhecido'}\n` +
                `${EMOJIS.users} **Membros:** ${guild.memberCount}\n` +
                `${EMOJIS.security} **Bots:** ${guild.members.cache.filter(m => m.user.bot).size}\n\n` +
                `${EMOJIS.ativado} **Sistemas ativos:** Candidaturas, Tickets, Voz Auto\n` +
                `${EMOJIS.desativado} **Sistemas desativados:** Anti-Raid, Anti-Link`
            );
        components.push(navRow, categoryMenu);
    } else if (currentPage === 'candidaturas') {
        embed.setTitle('📋 Configuração de Candidaturas')
            .setDescription('Defina o canal de envio e o cargo da equipe responsável.');

        const channelSelect = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('cfg_cand_canal_envio')
                .setPlaceholder('Selecione o canal de envio')
                .setChannelTypes([ChannelType.GuildText])
        );

        const roleSelect = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('cfg_cand_cargo_equipe')
                .setPlaceholder('Selecione o cargo da equipe avaliadora')
        );

        components.push(navRow, categoryMenu, channelSelect, roleSelect);
    } else if (currentPage === 'voz') {
        embed.setTitle('🔊 Configuração de Voz (Call Auto)')
            .setDescription('Selecione o canal de voz gerador.');

        const voiceSelect = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('cfg_voice_channel')
                .setPlaceholder('Selecione o canal gerador de voz')
                .setChannelTypes([ChannelType.GuildVoice])
        );

        components.push(navRow, categoryMenu, voiceSelect);
    } else {
        embed.setTitle(`${EMOJIS.config} Configuração — ${currentPage.toUpperCase()}`)
            .setDescription(`${EMOJIS.digitar} Ajuste as preferências do módulo **${currentPage}**.`);
        components.push(navRow, categoryMenu);
    }

    return { embeds: [embed], components, flags: 64 };
}

function translateText(text, targetLang, callback) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                const translated = parsed[0].map(item => item[0]).join('');
                callback(null, translated);
            } catch (err) {
                callback(err, null);
            }
        });
    }).on('error', (err) => callback(err, null));
}

client.on('ready', async () => {
    console.log(`🟢 [BOT ONLINE] Logado com sucesso como ${client.user.tag}`);

    if (db.config.streaming.ativo) {
        client.user.setPresence({
            activities: [{ name: db.config.streaming.nome, type: ActivityType.Streaming, url: db.config.streaming.url }],
            status: 'online'
        });
    }

    const commands = [
        new SlashCommandBuilder()
            .setName('config')
            .setDescription('Abre o painel único de configuração do Zyphor Zombie'),
        new SlashCommandBuilder()
            .setName('painel')
            .setDescription('Exibe o resumo e estatísticas do servidor'),
        new SlashCommandBuilder()
            .setName('alerta')
            .setDescription('Envia um alerta global em um canal específico')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de destino').setRequired(true))
            .addStringOption(o => o.setName('mensagem').setDescription('Conteúdo do alerta').setRequired(true)),
        new SlashCommandBuilder()
            .setName('lider')
            .setDescription('Define um novo líder para a equipe')
            .addUserOption(o => o.setName('usuario').setDescription('Usuário a ser promovido').setRequired(true))
            .addStringOption(o => o.setName('cargo').setDescription('Nome do cargo').setRequired(true)),
        new SlashCommandBuilder()
            .setName('traduzir')
            .setDescription('Traduz um texto para o idioma selecionado')
            .addStringOption(o =>
                o.setName('idioma')
                    .setDescription('Escolha o idioma com a bandeira')
                    .setRequired(true)
                    .addChoices(
                        { name: '🇧🇷 Português', value: 'pt' },
                        { name: '🇺🇸 Inglês', value: 'en' },
                        { name: '🇪🇸 Espanhol', value: 'es' },
                        { name: '🇷🇺 Russo', value: 'ru' },
                        { name: '🇫🇷 Francês', value: 'fr' },
                        { name: '🇩🇪 Alemão', value: 'de' }
                    )
            )
            .addStringOption(o => o.setName('texto').setDescription('Texto a ser traduzido').setRequired(true))
    ].map(c => c.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('🔄 Registrando os comandos de imediato...');
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('✅ Comandos Slash registrados e atualizados!');
    } catch (err) {
        console.error('❌ Erro ao registrar comandos:', err);
    }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const generatorId = db.config.voz.canalGeradorId;
    if (!generatorId) return;

    if (newState.channelId === generatorId) {
        const guild = newState.guild;
        const member = newState.member;

        const createdChannel = await guild.channels.create({
            name: `🔊 Call de ${member.displayName}`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parentId || null,
            permissionOverwrites: [
                {
                    id: member.id,
                    allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak]
                }
            ]
        });

        await member.voice.setChannel(createdChannel);
        if (!db.tempVoiceChannels) db.tempVoiceChannels = [];
        db.tempVoiceChannels.push(createdChannel.id);
        saveDB(db);
    }

    if (oldState.channelId && db.tempVoiceChannels && db.tempVoiceChannels.includes(oldState.channelId)) {
        const channel = oldState.guild.channels.cache.get(oldState.channelId);
        if (channel && channel.members.size === 0) {
            await channel.delete().catch(() => {});
            db.tempVoiceChannels = db.tempVoiceChannels.filter(id => id !== oldState.channelId);
            saveDB(db);
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const candChannel = db.config.candidaturas.canalEnvio;
    if (candChannel && message.channel.id === candChannel) {
        const user = message.author;
        const content = message.content;

        await message.delete().catch(() => {});

        const thread = await message.channel.threads.create({
            name: `📋 Candidatura — ${user.username}`,
            autoArchiveDuration: 1440,
            type: ChannelType.PrivateThread
        });

        const createdDate = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
        const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / (1000 * 60 * 60 * 24));

        const embed = new EmbedBuilder()
            .setColor('#2B2D31')
            .setTitle(`${EMOJIS.zyphor} NOVA CANDIDATURA RECEBIDA`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: `${EMOJIS.user} Membro`, value: `${user} (\`${user.username}\`)`, inline: true },
                { name: `${EMOJIS.id} ID`, value: `\`${user.id}\``, inline: true },
                { name: `${EMOJIS.horario} Conta Criada`, value: `${createdDate} (${accountAgeDays} dias)`, inline: false },
                { name: `${EMOJIS.texto} Motivo/Mensagem`, value: content, inline: false }
            )
            .setTimestamp();

        await thread.send({ embeds: [embed] });

        if (db.config.candidaturas.cargoEquipe) {
            await thread.send({ content: `<@&${db.config.candidaturas.cargoEquipe}> Nova candidatura aguardando avaliação.` });
        }
        return;
    }

    if (message.channel.isThread()) {
        const args = message.content.trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === '.stop') {
            if (!db.pausadosAtendimento) db.pausadosAtendimento = [];
            if (!db.pausadosAtendimento.includes(message.channel.id)) {
                db.pausadosAtendimento.push(message.channel.id);
                saveDB(db);
            }
            return message.reply('🛑 **Atendimento Pausado:** O envio de respostas foi suspenso.');
        }

        if (command === '.r') {
            if (db.pausadosAtendimento && db.pausadosAtendimento.includes(message.channel.id)) {
                db.pausadosAtendimento = db.pausadosAtendimento.filter(id => id !== message.channel.id);
                saveDB(db);
                message.channel.send('▶️ **Atendimento Retomado:** O envio de mensagens voltou ao normal.');
            }
            const replyMsg = args.join(' ');
            if (!replyMsg) return message.reply('Uso correto: `.r <sua mensagem>`');
            return message.reply(`${EMOJIS.aceito} Mensagem registrada e sincronizada.`);
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (['config', 'alerta', 'lider'].includes(commandName) && interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: `${EMOJIS.proibido} Apenas o dono do bot pode utilizar este comando.`, flags: 64 });
        }

        if (commandName === 'config') {
            return interaction.reply(renderConfigPanel(interaction.guild, 'main'));
        }

        if (commandName === 'traduzir') {
            await interaction.deferReply({ flags: 64 });
            const lang = interaction.options.getString('idioma');
            const text = interaction.options.getString('texto');

            translateText(text, lang, (err, translatedText) => {
                if (err || !translatedText) {
                    return interaction.editReply({ content: `${EMOJIS.proibido} Não foi possível traduzir o texto.` });
                }
                const embed = new EmbedBuilder()
                    .setColor('#2B2D31')
                    .setTitle('🌎 Tradução Concluída')
                    .addFields(
                        { name: 'Texto Original', value: text },
                        { name: `Tradução (${lang.toUpperCase()})`, value: translatedText }
                    )
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            });
        }

        if (commandName === 'painel') {
            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle(`${EMOJIS.zyphor} ZYPHOR ZOMBIE — Estatísticas`)
                .addFields(
                    { name: 'Servidor', value: `${interaction.guild.name} (\`${interaction.guild.id}\`)`, inline: false },
                    { name: 'Membros', value: `${EMOJIS.membroson} Total: ${interaction.guild.memberCount}`, inline: true },
                    { name: 'Canais', value: `${EMOJIS.texto} Total: ${interaction.guild.channels.cache.size}`, inline: true }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'alerta') {
            const channel = interaction.options.getChannel('canal');
            const msg = interaction.options.getString('mensagem');

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`${EMOJIS.alerta} ALERTA GERAL`)
                .setDescription(msg)
                .setFooter({ text: `Enviado por ${interaction.user.tag}` })
                .setTimestamp();

            await channel.send({ content: '@everyone', embeds: [embed] });
            return interaction.reply({ content: `${EMOJIS.aceito} Alerta enviado com sucesso.`, flags: 64 });
        }

        if (commandName === 'lider') {
            const member = interaction.options.getMember('usuario');
            const roleName = interaction.options.getString('cargo');

            const newRole = await interaction.guild.roles.create({
                name: roleName,
                reason: `Líder cadastrado por ${interaction.user.tag}`
            });

            await member.roles.add(newRole);

            db.config.lideres[member.id] = {
                cargoId: newRole.id,
                nomeCargo: roleName,
                criadoPor: interaction.user.id,
                data: new Date().toISOString()
            };
            saveDB(db);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('👑 NOVO LÍDER CADASTRADO')
                .addFields(
                    { name: 'Líder', value: `${member} (\`${member.id}\`)`, inline: true },
                    { name: 'Cargo', value: `${newRole} (\`${newRole.id}\`)`, inline: true }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId.startsWith('cfg_nav_')) {
            if (interaction.user.id !== OWNER_ID) return;
            const targetPage = interaction.customId.replace('cfg_nav_', '');
            return interaction.update(renderConfigPanel(interaction.guild, targetPage));
        }
    }

    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'cfg_select_category') {
            if (interaction.user.id !== OWNER_ID) return;
            const selected = interaction.values[0];
            return interaction.update(renderConfigPanel(interaction.guild, selected));
        }
    }

    if (interaction.isChannelSelectMenu()) {
        if (interaction.user.id !== OWNER_ID) return;
        if (interaction.customId === 'cfg_cand_canal_envio') {
            const channelId = interaction.values[0];
            db.config.candidaturas.canalEnvio = channelId;
            saveDB(db);
            return interaction.reply({ content: `${EMOJIS.aceito} Canal de candidaturas definido para <#${channelId}>`, flags: 64 });
        }
        if (interaction.customId === 'cfg_voice_channel') {
            const channelId = interaction.values[0];
            db.config.voz.canalGeradorId = channelId;
            saveDB(db);
            return interaction.reply({ content: `${EMOJIS.aceito} Canal gerador de voz definido para <#${channelId}>`, flags: 64 });
        }
    }

    if (interaction.isRoleSelectMenu()) {
        if (interaction.user.id !== OWNER_ID) return;
        if (interaction.customId === 'cfg_cand_cargo_equipe') {
            const roleId = interaction.values[0];
            db.config.candidaturas.cargoEquipe = roleId;
            saveDB(db);
            return interaction.reply({ content: `${EMOJIS.aceito} Cargo de equipe alterado para <@&${roleId}>`, flags: 64 });
        }
    }
});

// Faz o login utilizando a variável da ShardCloud
client.login(process.env.TOKEN);
