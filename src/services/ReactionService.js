import { REROLL_EMOJI, NUMBER_EMOJIS } from '../utils/constants.js';
import { createWeaponEmbed } from '../utils/embedBuilder.js';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * リアクション管理サービス
 * Single Responsibility Principle (SRP) に従い、リアクション操作とタイマー管理に特化
 */
export class ReactionService {
  constructor(messageStateManager) {
    this.messageStateManager = messageStateManager;
  }

  /**
   * 武器割り当てメッセージにリアクションを追加
   * @param {Message} message - Discordメッセージ
   * @param {number} assignmentCount - 割り当て数
   */
  async addReactions(message, assignmentCount) {
    await message.react(REROLL_EMOJI);
    
    const reactionCount = Math.min(assignmentCount, NUMBER_EMOJIS.length);
    for (let i = 0; i < reactionCount; i++) {
      await message.react(NUMBER_EMOJIS[i]);
    }
  }

  /**
   * 再抽選タイマーをスケジュール（20秒後に期限切れ）
   * @param {Message} message - Discordメッセージ
   * @param {Array} assignments - 武器割り当て配列
   * @param {number} disabledCount - 除外武器数
   * @param {string|null} weaponTypeFilter - 武器種別フィルタ
   */
  scheduleRerollExpiration(message, assignments, disabledCount, weaponTypeFilter) {
    setTimeout(async () => {
      try {
        const rerollReaction = message.reactions.cache.get(REROLL_EMOJI);
        if (rerollReaction) {
          await rerollReaction.remove();
        }

        const updatedEmbed = createWeaponEmbed(
          assignments,
          disabledCount,
          weaponTypeFilter,
          false,
          true
        );
        await message.edit({ embeds: [updatedEmbed] });
      } catch (error) {
        ErrorHandler.log(error, 'Reroll expiration');
      }
    }, 20000);
  }

  /**
   * メッセージに武器割り当て処理を適用
   * @param {Message} message - Discordメッセージ
   * @param {Array} assignments - 武器割り当て配列
   * @param {number} disabledCount - 除外武器数
   * @param {string|null} weaponType - 武器種別
   */
  async setupReactionHandling(message, assignments, disabledCount, weaponType) {
    // メッセージ状態を登録
    this.messageStateManager.registerMessageCreationTime(message.id);
    
    // リアクション追加
    await this.addReactions(message, assignments.length);
    
    // 再抽選期限のタイマーをセット
    this.scheduleRerollExpiration(message, assignments, disabledCount, weaponType);
  }
}
