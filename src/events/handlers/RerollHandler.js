import { ReactionHandler } from './ReactionHandler.js';
import { REROLL_EMOJI, REROLL_COOLDOWN } from '../../utils/constants.js';
import { 
  VoiceChannelRerollStrategy, 
  SimpleRerollStrategy 
} from '../strategies/RerollStrategy.js';
import { ErrorHandler } from '../../utils/errorHandler.js';

/**
 * 再抽選リアクションハンドラー
 * Strategy パターンで再抽選ロジックを委譲
 */
export class RerollHandler extends ReactionHandler {
  constructor(messageCreationTimes, rerolledMessages) {
    super();
    this.messageCreationTimes = messageCreationTimes;
    this.rerolledMessages = rerolledMessages;
  }

  async canHandle(context) {
    return context.emojiName === REROLL_EMOJI;
  }

  async process(context) {
    const { message, user, reaction } = context;

    const timeCheck = this.#validateReroll(message.id);
    if (!timeCheck.valid) {
      await this.#sendFeedback(message.channel, timeCheck.message);
      await this.#removeReaction(reaction, user, timeCheck.removeEmoji);
      return true;
    }

    await this.#executeReroll(message, user);
    this.rerolledMessages.set(message.id, true);
    await this.#removeReaction(reaction, user, true);
    
    return true;
  }

  /**
   * 再抽選の妥当性を検証
   */
  #validateReroll(messageId) {
    const createdAt = this.messageCreationTimes.get(messageId);

    if (!createdAt) {
      return {
        valid: false,
        message: '⚠️ このメッセージは再抽選できません',
        removeEmoji: true
      };
    }

    if (this.rerolledMessages.has(messageId)) {
      return {
        valid: false,
        message: '❌ 再抽選は1回のみ可能です',
        removeEmoji: false
      };
    }

    const elapsed = Date.now() - createdAt;
    if (elapsed > REROLL_COOLDOWN) {
      return {
        valid: false,
        message: '❌ 再抽選は最初の20秒以内のみ可能です',
        removeEmoji: true
      };
    }

    return { valid: true };
  }

  /**
   * フィードバックメッセージ送信
   */
  async #sendFeedback(channel, message) {
    try {
      await channel.send(message);
    } catch (error) {
      ErrorHandler.log(error, 'Send feedback message');
    }
  }

  /**
   * リアクション削除
   */
  async #removeReaction(reaction, user, removeEmoji) {
    try {
      await reaction.users.remove(user.id);
      if (removeEmoji) await reaction.remove();
    } catch (error) {
      ErrorHandler.log(error, 'Remove reaction');
    }
  }

  /**
   * 再抽選実行（Strategy パターン）
   */
  async #executeReroll(message, user) {
    const member = await message.guild.members.fetch(user.id);
    const strategy = member.voice.channel 
      ? new VoiceChannelRerollStrategy(member.voice.channel)
      : new SimpleRerollStrategy();

    await strategy.execute(message);
  }
}
