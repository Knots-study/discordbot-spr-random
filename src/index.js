import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import handleReaction from './events/reactionAdd.js';
import { COMMAND_PREFIX } from './utils/constants.js';
import { ErrorHandler } from './utils/errorHandler.js';
import { validateEnv, printEnvStatus } from './utils/envValidator.js';

// 環境変数を読み込み
config();

// 環境変数をバリデーション
try {
  validateEnv();
  printEnvStatus();
} catch (error) {
  ErrorHandler.handleFatalError(error, 'Environment validation');
}

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
    const filePath = `file://${join(commandsPath, file)}`;
    const command = (await import(filePath)).default;
    
    if (command?.name) {
      client.commands.set(command.name, command);
    }
  }
}

/**
 * イベントハンドラー登録
 */
function registerEventHandlers(client) {
  client.on('clientReady', () => {
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
      await ErrorHandler.handleCommandError(error, message, commandName);
    }
  });

  client.on('messageReactionAdd', async (reaction, user) => {
    try {
      await handleReaction(reaction, user, client);
    } catch (error) {
      ErrorHandler.handleReactionError(error, reaction, 'messageReactionAdd');
    }
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Botを終了します...');
    client.destroy();
    process.exit(0);
  });

  // 未処理の例外をキャッチ
  process.on('uncaughtException', (error) => {
    ErrorHandler.handleFatalError(error, 'Uncaught Exception');
  });

  // 未処理のPromise rejectをキャッチ
  process.on('unhandledRejection', (reason, promise) => {
    ErrorHandler.log(reason, 'Unhandled Rejection');
  });
}

/**
 * Bot起動
 */
async function startBot() {
  try {
    const client = createClient();
    await loadCommands(client);
    registerEventHandlers(client);
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    ErrorHandler.handleFatalError(error, 'Bot startup');
  }
}

startBot();
