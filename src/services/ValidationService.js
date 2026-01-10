import { getHumanMembers } from '../utils/weaponSelector.js';

/**
 * バリデーションサービス
 * Single Responsibility Principle (SRP) に従い、入力検証に特化
 */
export class ValidationService {
  constructor(weaponRepository) {
    this.weaponRepository = weaponRepository;
  }

  /**
   * ボイスチャンネル参加状態を検証
   * @param {GuildMember} member - Discordギルドメンバー
   * @returns {Object} 検証結果
   */
  validateVoiceChannel(member) {
    const voiceChannel = member.voice.channel;
    
    if (!voiceChannel) {
      return {
        valid: false,
        error: 'ボイスチャンネルに参加してから実行してください！'
      };
    }

    const members = getHumanMembers(voiceChannel);
    
    if (members.size === 0) {
      return {
        valid: false,
        error: 'ボイスチャンネルに参加者がいません！'
      };
    }

    return {
      valid: true,
      voiceChannel,
      members
    };
  }

  /**
   * 武器種別の妥当性を検証
   * @param {string|null} weaponType - 武器種別
   * @returns {Object} 検証結果
   */
  validateWeaponType(weaponType) {
    if (!weaponType) {
      return { valid: true };
    }

    const validTypes = this.weaponRepository.getWeaponTypes();
    
    if (!validTypes.includes(weaponType)) {
      return {
        valid: false,
        error: `武器種別 "${weaponType}" は存在しません！\n有効な種別: ${validTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * コマンド実行の包括的な検証
   * @param {GuildMember} member - Discordギルドメンバー
   * @param {string|null} weaponType - 武器種別
   * @returns {Object} 検証結果
   */
  validateRandomCommand(member, weaponType) {
    // ボイスチャンネル検証
    const voiceValidation = this.validateVoiceChannel(member);
    if (!voiceValidation.valid) {
      return voiceValidation;
    }

    // 武器種別検証
    const typeValidation = this.validateWeaponType(weaponType);
    if (!typeValidation.valid) {
      return typeValidation;
    }

    return {
      valid: true,
      voiceChannel: voiceValidation.voiceChannel,
      members: voiceValidation.members
    };
  }
}
