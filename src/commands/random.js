import { createWeaponEmbed } from '../utils/embedBuilder.js';
import { sendError } from '../utils/messageHelper.js';
import weaponRepository from '../repositories/WeaponRepository.js';
import { WeaponAssignmentService } from '../services/WeaponAssignmentService.js';
import { ValidationService } from '../services/ValidationService.js';
import { ReactionService } from '../services/ReactionService.js';
import messageStateManager from '../services/MessageStateManager.js';

/**
 * ランダム武器選出コマンド
 * Dependency Injection (DI) を使用してSOLID原則に準拠
 */
class RandomCommand {
  constructor(weaponRepository, messageStateManager) {
    this.validationService = new ValidationService(weaponRepository);
    this.assignmentService = new WeaponAssignmentService(weaponRepository);
    this.reactionService = new ReactionService(messageStateManager);
  }

  async execute(message, args) {
    const weaponTypeFilter = args.join(' ') || null;

    // バリデーション
    const validation = this.validationService.validateRandomCommand(
      message.member,
      weaponTypeFilter
    );

    if (!validation.valid) {
      return sendError(message, validation.error);
    }

    // 武器割り当て
    const assignment = await this.assignmentService.assignWeaponsToMembers(
      validation.members,
      weaponTypeFilter
    );

    if (!assignment.success) {
      return sendError(message, assignment.error);
    }

    // Embed作成とメッセージ送信
    const embed = createWeaponEmbed(
      assignment.assignments,
      assignment.disabledCount,
      weaponTypeFilter
    );
    const sentMessage = await message.reply({ embeds: [embed] });

    // リアクション処理のセットアップ
    await this.reactionService.setupReactionHandling(
      sentMessage,
      assignment.assignments,
      assignment.disabledCount,
      weaponTypeFilter
    );
  }
}

// コマンド定義（DIでインスタンス化）
const randomCommand = new RandomCommand(weaponRepository, messageStateManager);

export default {
  name: 'random',
  description: 'ボイスチャンネル参加者に武器を選出（武器種別指定可）',
  execute: (message, args) => randomCommand.execute(message, args)
};
