import weaponRepository from '../../repositories/WeaponRepository.js';
import { selectRandomWeapons, getHumanMembers } from '../../utils/weaponSelector.js';
import { createWeaponEmbed, createSimpleWeaponEmbed } from '../../utils/embedBuilder.js';

/**
 * 再抽選戦略の基底クラス
 * Strategy パターン
 */
export class RerollStrategy {
  /**
   * 再抽選を実行
   * @param {Object} message - Discordメッセージオブジェクト
   * @returns {Promise<void>}
   */
  async execute(message) {
    throw new Error('execute() must be implemented');
  }

  /**
   * タイトルから武器種別を抽出
   */
  extractWeaponTypeFromTitle(title) {
    if (!title) return null;

    const match = title.match(/【(.+?)】/);
    return match && match[1] !== '再抽選' ? match[1] : null;
  }
}

/**
 * ボイスチャンネルありの再抽選戦略
 */
export class VoiceChannelRerollStrategy extends RerollStrategy {
  constructor(voiceChannel) {
    super();
    this.voiceChannel = voiceChannel;
  }

  async execute(message) {
    const members = getHumanMembers(this.voiceChannel);
    if (members.size === 0) return;

    const originalEmbed = message.embeds[0];
    const weaponType = this.extractWeaponTypeFromTitle(originalEmbed?.title);

    const [availableWeapons, disabledWeapons] = await Promise.all([
      weaponRepository.getEnabledWeapons(weaponType),
      weaponRepository.getDisabledWeapons()
    ]);

    if (availableWeapons.length === 0 || members.size > availableWeapons.length) {
      return;
    }

    const selectedWeapons = selectRandomWeapons(availableWeapons, members.size);
    const membersArray = Array.from(members.values());
    const assignments = membersArray.map((m, i) => ({
      member: m,
      weapon: selectedWeapons[i]
    }));

    const embed = createWeaponEmbed(assignments, disabledWeapons.length, weaponType, true);
    await message.edit({ embeds: [embed] });
  }
}

/**
 * シンプルな再抽選戦略（ボイスチャンネルなし）
 */
export class SimpleRerollStrategy extends RerollStrategy {
  async execute(message) {
    const originalEmbed = message.embeds[0];
    if (!originalEmbed?.description) return;

    const count = originalEmbed.description.split('\n').length;
    
    const [availableWeapons, disabledWeapons] = await Promise.all([
      weaponRepository.getEnabledWeapons(),
      weaponRepository.getDisabledWeapons()
    ]);

    if (availableWeapons.length === 0 || count > availableWeapons.length) {
      return;
    }

    const selectedWeapons = selectRandomWeapons(availableWeapons, count);
    const embed = createSimpleWeaponEmbed(selectedWeapons, disabledWeapons.length);
    await message.edit({ embeds: [embed] });
  }
}
