import { RerollHandler } from './handlers/RerollHandler.js';
import { WeaponExclusionHandler } from './handlers/WeaponExclusionHandler.js';
import { ErrorHandler } from '../utils/errorHandler.js';

// メッセージ状態管理（DI用）
const messageCreationTimes = new Map();
const rerolledMessages = new Map();

// メモリリーク対策: 古いエントリを定期的にクリーンアップ
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分
const MAX_ENTRY_AGE = 60 * 60 * 1000; // 1時間

/**
 * 古いエントリをクリーンアップ
 */
function cleanupOldEntries() {
  const cutoff = Date.now() - MAX_ENTRY_AGE;

  for (const [messageId, timestamp] of messageCreationTimes.entries()) {
    if (timestamp < cutoff) {
      messageCreationTimes.delete(messageId);
      rerolledMessages.delete(messageId);
    }
  }
}

// 定期クリーンアップ開始
setInterval(cleanupOldEntries, CLEANUP_INTERVAL);

// ハンドラーチェーン構築（Chain of Responsibility）
const rerollHandler = new RerollHandler(messageCreationTimes, rerolledMessages);
const weaponExclusionHandler = new WeaponExclusionHandler();
rerollHandler.setNext(weaponExclusionHandler);

/**
 * メッセージ作成時刻を記録
 */
export function registerMessageCreationTime(messageId) {
  messageCreationTimes.set(messageId, Date.now());
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

  await rerollHandler.handle(context);
}

// テスト用エクスポート
export const __test__ = {
  clearMaps: () => {
    messageCreationTimes.clear();
    rerolledMessages.clear();
  }
};
