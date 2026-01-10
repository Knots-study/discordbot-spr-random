import { ReactionHandler } from './ReactionHandler.js';
import { NUMBER_EMOJIS, WEAPON_NAME_PATTERN } from '../../utils/constants.js';
import { disableWeapon } from '../../database.js';
import { ErrorHandler } from '../../utils/errorHandler.js';

/**
 * 番号リアクションによる武器除外ハンドラー
 */
export class WeaponExclusionHandler extends ReactionHandler {
  async canHandle(context) {
    return NUMBER_EMOJIS.includes(context.emojiName);
  }

  async process(context) {
    const { message, user, emojiName, reaction } = context;

    const weaponIndex = NUMBER_EMOJIS.indexOf(emojiName);
    const weaponName = this.#extractWeaponName(message.embeds[0], weaponIndex);

    if (weaponName && await disableWeapon(weaponName)) {
      await this.#sendFeedback(message.channel, user.id, weaponName);
    }

    await this.#removeUserReaction(reaction, user);
    return true;
  }

  /**
   * Embedから武器名を抽出
   */
  #extractWeaponName(embed, index) {
    if (!embed?.description) return null;

    const lines = embed.description.split('\n');
    const match = lines[index]?.match(WEAPON_NAME_PATTERN);
    
    return match?.[1] ?? null;
  }

  /**
   * 除外完了フィードバック
   */
  async #sendFeedback(channel, userId, weaponName) {
    try {
      await channel.send(`✅ <@${userId}> が **${weaponName}** を除外リストに追加しました`);
    } catch (error) {
      ErrorHandler.log(error, 'Send weapon exclusion feedback');
    }
  }

  /**
   * ユーザーリアクション削除
   */
  async #removeUserReaction(reaction, user) {
    try {
      await reaction.users.remove(user.id);
    } catch (error) {
      ErrorHandler.log(error, 'Remove user reaction');
    }
  }
}

