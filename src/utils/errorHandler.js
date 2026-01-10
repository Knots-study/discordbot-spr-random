/**
 * アプリケーション全体で使用するカスタムエラークラス
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * データベース関連のエラー
 */
export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 'DATABASE_ERROR', true);
    this.originalError = originalError;
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 'VALIDATION_ERROR', true);
    this.field = field;
  }
}

/**
 * Discord API関連のエラー
 */
export class DiscordAPIError extends AppError {
  constructor(message, originalError = null) {
    super(message, 'DISCORD_API_ERROR', true);
    this.originalError = originalError;
  }
}

/**
 * 統一されたエラーハンドラー
 */
export class ErrorHandler {
  /**
   * エラーをログに記録
   */
  static log(error, context = '') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [ERROR]`;
    
    if (error instanceof AppError) {
      console.error(`${prefix} [${error.code}] ${context}:`, error.message);
      if (error.originalError) {
        console.error('Original error:', error.originalError);
      }
    } else {
      console.error(`${prefix} ${context}:`, error);
    }

    // 本番環境では外部ログサービスに送信することも可能
    if (process.env.NODE_ENV === 'production') {
      // 例: Sentry, CloudWatch, etc.
    }
  }

  /**
   * ユーザーに表示するエラーメッセージを生成
   */
  static getUserMessage(error) {
    if (error instanceof ValidationError) {
      return `❌ 入力エラー: ${error.message}`;
    }
    
    if (error instanceof DatabaseError) {
      return '❌ データベースエラーが発生しました。しばらくしてから再試行してください。';
    }
    
    if (error instanceof DiscordAPIError) {
      return '❌ Discord APIエラーが発生しました。しばらくしてから再試行してください。';
    }
    
    if (error instanceof AppError && error.isOperational) {
      return `❌ ${error.message}`;
    }
    
    // 予期しないエラー
    return '❌ 予期しないエラーが発生しました。管理者に連絡してください。';
  }

  /**
   * コマンド実行時のエラーハンドリング
   */
  static async handleCommandError(error, message, commandName) {
    this.log(error, `Command: ${commandName}`);
    
    try {
      const userMessage = this.getUserMessage(error);
      await message.reply(userMessage);
    } catch (replyError) {
      console.error('Failed to send error message to user:', replyError);
    }
  }

  /**
   * リアクション処理のエラーハンドリング
   */
  static async handleReactionError(error, reaction, context = '') {
    this.log(error, `Reaction: ${context}`);
    
    // リアクションエラーはユーザーに通知しない（静かに失敗）
    // 必要に応じてチャンネルにメッセージを送信することも可能
  }

  /**
   * 致命的なエラー（プロセス終了が必要）
   */
  static handleFatalError(error, context = '') {
    console.error('='.repeat(50));
    console.error('FATAL ERROR - Application will exit');
    console.error('='.repeat(50));
    this.log(error, context);
    console.error('='.repeat(50));
    
    // グレースフルシャットダウン
    process.exit(1);
  }
}

/**
 * 非同期関数のエラーをキャッチするラッパー
 */
export function asyncHandler(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      throw error; // 上位レイヤーで処理
    }
  };
}
