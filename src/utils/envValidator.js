import { ValidationError } from './errorHandler.js';

/**
 * 必須の環境変数
 */
const REQUIRED_ENV_VARS = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID'
];

/**
 * オプショナルの環境変数とデフォルト値
 */
const OPTIONAL_ENV_VARS = {
  COMMAND_PREFIX: '!',
  REROLL_COOLDOWN: '20000',
  MAX_PLAYERS: '10',
  DB_PATH: './data/weapons.db',
  NODE_ENV: 'development',
  DEBUG: 'false'
};

/**
 * 環境変数のバリデーション設定
 */
const VALIDATION_RULES = {
  DISCORD_TOKEN: {
    validate: (value) => value && value.length > 50,
    message: 'DISCORD_TOKENは50文字以上である必要があります'
  },
  DISCORD_CLIENT_ID: {
    validate: (value) => /^\d+$/.test(value),
    message: 'DISCORD_CLIENT_IDは数字のみである必要があります'
  },
  REROLL_COOLDOWN: {
    validate: (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 0 && num <= 300000;
    },
    message: 'REROLL_COOLDOWNは0〜300000（5分）の範囲である必要があります'
  },
  MAX_PLAYERS: {
    validate: (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 1 && num <= 20;
    },
    message: 'MAX_PLAYERSは1〜20の範囲である必要があります'
  }
};

/**
 * 環境変数をバリデーション
 */
export function validateEnv() {
  const errors = [];

  // 必須の環境変数をチェック
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      errors.push(`❌ 必須の環境変数 ${key} が設定されていません`);
    } else {
      // バリデーションルールが存在する場合はチェック
      const rule = VALIDATION_RULES[key];
      if (rule && !rule.validate(process.env[key])) {
        errors.push(`❌ ${key}: ${rule.message}`);
      }
    }
  }

  // オプショナルの環境変数にデフォルト値を設定
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    } else {
      // バリデーションルールが存在する場合はチェック
      const rule = VALIDATION_RULES[key];
      if (rule && !rule.validate(process.env[key])) {
        errors.push(`❌ ${key}: ${rule.message}`);
      }
    }
  }

  // エラーがある場合は例外をスロー
  if (errors.length > 0) {
    const errorMessage = [
      '環境変数の設定に問題があります:',
      ...errors,
      '',
      '.envファイルを確認してください。',
      '例:',
      'DISCORD_TOKEN=your_token_here',
      'DISCORD_CLIENT_ID=your_client_id_here'
    ].join('\n');

    throw new ValidationError(errorMessage, 'ENV_VARS');
  }
}

/**
 * 環境変数を取得（型変換済み）
 */
export function getEnvConfig() {
  return {
    discord: {
      token: process.env.DISCORD_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID
    },
    bot: {
      commandPrefix: process.env.COMMAND_PREFIX,
      rerollCooldown: parseInt(process.env.REROLL_COOLDOWN),
      maxPlayers: parseInt(process.env.MAX_PLAYERS)
    },
    database: {
      path: process.env.DB_PATH
    },
    app: {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
      isDevelopment: process.env.NODE_ENV === 'development',
      debug: process.env.DEBUG === 'true'
    }
  };
}

/**
 * 環境変数の設定状況を表示（デバッグ用）
 */
export function printEnvStatus() {
  if (process.env.DEBUG !== 'true') return;

  console.log('='.repeat(50));
  console.log('Environment Configuration:');
  console.log('='.repeat(50));
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`COMMAND_PREFIX: ${process.env.COMMAND_PREFIX}`);
  console.log(`REROLL_COOLDOWN: ${process.env.REROLL_COOLDOWN}ms`);
  console.log(`MAX_PLAYERS: ${process.env.MAX_PLAYERS}`);
  console.log(`DB_PATH: ${process.env.DB_PATH}`);
  console.log(`DEBUG: ${process.env.DEBUG}`);
  console.log('='.repeat(50));
}
