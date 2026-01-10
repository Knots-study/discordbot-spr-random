/**
 * メッセージ状態管理クラス
 * Single Responsibility Principle (SRP) に従い、メッセージ状態管理に特化
 */
export class MessageStateManager {
  constructor() {
    this.messageCreationTimes = new Map();
    this.rerolledMessages = new Map();
    this.startCleanupInterval();
  }

  /**
   * メッセージ作成時刻を記録
   * @param {string} messageId - メッセージID
   */
  registerMessageCreationTime(messageId) {
    this.messageCreationTimes.set(messageId, Date.now());
  }

  /**
   * メッセージ作成時刻を取得
   * @param {string} messageId - メッセージID
   * @returns {number|undefined} 作成時刻のタイムスタンプ
   */
  getMessageCreationTime(messageId) {
    return this.messageCreationTimes.get(messageId);
  }

  /**
   * メッセージが再抽選済みかチェック
   * @param {string} messageId - メッセージID
   * @returns {boolean}
   */
  isRerolled(messageId) {
    return this.rerolledMessages.has(messageId);
  }

  /**
   * メッセージを再抽選済みとしてマーク
   * @param {string} messageId - メッセージID
   */
  markAsRerolled(messageId) {
    this.rerolledMessages.set(messageId, true);
  }

  /**
   * 古いエントリをクリーンアップ
   */
  cleanupOldEntries() {
    const MAX_ENTRY_AGE = 60 * 60 * 1000; // 1時間
    const cutoff = Date.now() - MAX_ENTRY_AGE;

    for (const [messageId, timestamp] of this.messageCreationTimes.entries()) {
      if (timestamp < cutoff) {
        this.messageCreationTimes.delete(messageId);
        this.rerolledMessages.delete(messageId);
      }
    }
  }

  /**
   * 定期クリーンアップを開始
   */
  startCleanupInterval() {
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分
    setInterval(() => this.cleanupOldEntries(), CLEANUP_INTERVAL);
  }

  /**
   * 全てのエントリをクリア（テスト用）
   */
  clear() {
    this.messageCreationTimes.clear();
    this.rerolledMessages.clear();
  }
}

// シングルトンインスタンスをエクスポート
const messageStateManager = new MessageStateManager();
export default messageStateManager;
