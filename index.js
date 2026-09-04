const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Iniciando a remoção dos comandos antigos...');

        // Reseta todos os comandos globais
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID || 'COLOQUE_SEU_CLIENT_ID_AQUI'),
            { body: [] }
        );

        console.log('✅ Todos os Slash Commands antigos foram removidos com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao remover os comandos:', error);
    }
})();
