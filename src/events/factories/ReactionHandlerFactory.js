import { RerollHandler } from '../handlers/RerollHandler.js';
import { WeaponExclusionHandler } from '../handlers/WeaponExclusionHandler.js';

/**
 * リアクションハンドラーファクトリー
 * Dependency Inversion Principle (DIP) に従い、ハンドラー構築を抽象化
 */
export class ReactionHandlerFactory {
  /**
   * ハンドラーチェーンを構築
   * @param {MessageStateManager} messageStateManager - メッセージ状態管理
   * @returns {ReactionHandler} ハンドラーチェーンの先頭
   */
  static createHandlerChain(messageStateManager) {
    const messageCreationTimes = messageStateManager.messageCreationTimes;
    const rerolledMessages = messageStateManager.rerolledMessages;

    // Chain of Responsibility パターンでハンドラーを連結
    const rerollHandler = new RerollHandler(messageCreationTimes, rerolledMessages);
    const weaponExclusionHandler = new WeaponExclusionHandler();
    
    rerollHandler.setNext(weaponExclusionHandler);

    return rerollHandler;
  }

  /**
   * カスタムハンドラーチェーンを構築（拡張用）
   * @param {Array<ReactionHandler>} handlers - ハンドラー配列
   * @returns {ReactionHandler} ハンドラーチェーンの先頭
   */
  static createCustomChain(handlers) {
    if (!handlers || handlers.length === 0) {
      throw new Error('At least one handler is required');
    }

    for (let i = 0; i < handlers.length - 1; i++) {
      handlers[i].setNext(handlers[i + 1]);
    }

    return handlers[0];
  }
}
