import { selectRandomWeapons } from '../utils/weaponSelector.js';

/**
 * 武器割り当てサービス
 * Single Responsibility Principle (SRP) に従い、武器選出とアサインメント作成に特化
 */
export class WeaponAssignmentService {
  constructor(weaponRepository) {
    this.weaponRepository = weaponRepository;
  }

  /**
   * メンバーに武器を割り当て
   * @param {Collection} members - Discordメンバーコレクション
   * @param {string|null} weaponType - 武器種別フィルタ
   * @returns {Promise<Object>} 割り当て結果
   */
  async assignWeaponsToMembers(members, weaponType = null) {
    const [availableWeapons, disabledWeapons] = await Promise.all([
      this.weaponRepository.getEnabledWeapons(weaponType),
      this.weaponRepository.getDisabledWeapons()
    ]);

    const validation = this.validateAssignment(members.size, availableWeapons.length, weaponType);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const selectedWeapons = selectRandomWeapons(availableWeapons, members.size);
    const membersArray = Array.from(members.values());
    const assignments = membersArray.map((member, i) => ({
      member,
      weapon: selectedWeapons[i]
    }));

    return {
      success: true,
      assignments,
      disabledCount: disabledWeapons.length,
      weaponType
    };
  }

  /**
   * 割り当ての妥当性を検証
   * @param {number} memberCount - メンバー数
   * @param {number} weaponCount - 利用可能な武器数
   * @param {string|null} weaponType - 武器種別
   * @returns {Object} 検証結果
   */
  validateAssignment(memberCount, weaponCount, weaponType) {
    if (weaponCount === 0) {
      if (weaponType) {
        return {
          valid: false,
          error: `${weaponType}の武器が全て除外されているか、存在しません！`
        };
      }
      return {
        valid: false,
        error: '全ての武器が除外されています！`!clear`で除外リストをクリアしてください。'
      };
    }

    if (memberCount > weaponCount) {
      return {
        valid: false,
        error: `利用可能な武器は${weaponCount}個です。参加者が多すぎます。`
      };
    }

    return { valid: true };
  }
}
