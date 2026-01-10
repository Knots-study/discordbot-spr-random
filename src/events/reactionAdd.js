import { ReactionHandlerFactory } from './factories/ReactionHandlerFactory.js';
import messageStateManager from '../services/MessageStateManager.js';
import { ErrorHandler } from '../utils/errorHandler.js';

// ハンドラーチェーン構築（Factory パターン）
const handlerChain = ReactionHandlerFactory.createHandlerChain(messageStateManager);

/**
 * メッセージ作成時刻を記録（後方互換性のため）
 */
export function registerMessageCreationTime(messageId) {
  messageStateManager.registerMessageCreationTime(messageId);
}

/**
 * リアクション追加イベントハンドラー
 */
export default async function handleReaction(reaction, user, client) {
  if (user.bot) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      ErrorHandler.log(error, 'Fetch partial reaction');
      throw error;
    }
  }

  const { message } = reaction;
  if (message.author.id !== client.user.id) return;

  const context = {
    reaction,
    user,
    client,
    message,
    emojiName: reaction.emoji.name
  };

  await handlerChain.handle(context);
}

// テスト用エクスポート
export const __test__ = {
  clearMaps: () => messageStateManager.clear()
};
