import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import handleReaction from './events/reactionAdd.js';
import { COMMAND_PREFIX } from './utils/constants.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Discord Botクライアント初期化
 */
function createClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });
}

/**
 * コマンドファイルを読み込み
 */
async function loadCommands(client) {
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  client.commands = new Collection();

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = (await import(`file://${filePath}`)).default;
    
    if (command?.name) {
      client.commands.set(command.name, command);
    }
  }
}

/**
 * イベントハンドラー登録
 */
function registerEventHandlers(client) {
  client.on('ready', () => {
    console.log(`✅ Botがログインしました: ${client.user.tag}`);
    console.log(`📝 登録コマンド数: ${client.commands.size}`);
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(COMMAND_PREFIX)) return;

    const args = message.content.slice(COMMAND_PREFIX.length).split(' ');
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(`コマンド実行エラー [${commandName}]:`, error);
      await message.reply('❌ コマンドの実行中にエラーが発生しました。');
    }
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      await handleReaction(reaction, user, client);
    } catch (error) {
      console.error('リアクション処理エラー:', error);
    }
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Botを終了します...');
    client.destroy();
    process.exit(0);
  });
}

/**
 * Bot起動
 */
async function startBot() {
  const client = createClient();
  await loadCommands(client);
  registerEventHandlers(client);
  await client.login(process.env.DISCORD_TOKEN);
}

startBot().catch(error => {
  console.error('Bot起動エラー:', error);
  process.exit(1);
});
