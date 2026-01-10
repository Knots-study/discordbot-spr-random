/**
 * リアクションハンドラーの基底クラス
 * Chain of Responsibility パターンを実装
 */
export class ReactionHandler {
  constructor() {
    this.nextHandler = null;
  }

  /**
   * 次のハンドラーを設定
   * @param {ReactionHandler} handler
   * @returns {ReactionHandler}
   */
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }

  /**
   * リアクションを処理
   * @param {Object} context - リアクション処理のコンテキスト
   * @returns {Promise<boolean>} - 処理が実行された場合true
   */
  async handle(context) {
    if (await this.canHandle(context)) {
      return await this.process(context);
    }
    
    if (this.nextHandler) {
      return await this.nextHandler.handle(context);
    }
    
    return false;
  }

  /**
   * このハンドラーで処理可能かチェック
   * @param {Object} context
   * @returns {Promise<boolean>}
   */
  async canHandle(context) {
    throw new Error('canHandle() must be implemented');
  }

  /**
   * 実際の処理を実行
   * @param {Object} context
   * @returns {Promise<boolean>}
   */
  async process(context) {
    throw new Error('process() must be implemented');
  }
}
