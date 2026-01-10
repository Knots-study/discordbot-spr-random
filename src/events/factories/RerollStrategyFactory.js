import { VoiceChannelRerollStrategy, SimpleRerollStrategy } from '../strategies/RerollStrategy.js';

/**
 * 再抽選戦略ファクトリー
 * Open/Closed Principle (OCP) に従い、戦略選択ロジックを分離
 */
export class RerollStrategyFactory {
  /**
   * 適切な再抽選戦略を作成
   * @param {GuildMember} member - Discordギルドメンバー
   * @returns {RerollStrategy} 再抽選戦略
   */
  static createStrategy(member) {
    const voiceChannel = member?.voice?.channel;
    
    if (voiceChannel) {
      return new VoiceChannelRerollStrategy(voiceChannel);
    }
    
    return new SimpleRerollStrategy();
  }

  /**
   * カスタム戦略を登録（将来の拡張用）
   * @param {string} type - 戦略タイプ
   * @param {Function} strategyClass - 戦略クラス
   */
  static registerStrategy(type, strategyClass) {
    if (!this.customStrategies) {
      this.customStrategies = new Map();
    }
    this.customStrategies.set(type, strategyClass);
  }

  /**
   * カスタム戦略を取得
   * @param {string} type - 戦略タイプ
   * @param {...any} args - 戦略コンストラクタに渡す引数
   * @returns {RerollStrategy|null}
   */
  static getCustomStrategy(type, ...args) {
    if (!this.customStrategies) {
      return null;
    }
    
    const StrategyClass = this.customStrategies.get(type);
    return StrategyClass ? new StrategyClass(...args) : null;
  }
}
