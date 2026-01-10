import { initDatabase, getKnex } from '../db/connection.js';
import { ALL_WEAPONS, WEAPON_TYPES } from '../data/weapons.js';
import { DatabaseError } from '../utils/errorHandler.js';

/**
 * 武器データアクセスリポジトリ
 * Dependency Inversion Principle (DIP) に従い、データアクセスを抽象化
 */
export class WeaponRepository {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * 武器データを初期化（初回のみ実行）
   */
  async ensureInitialized() {
    if (this.isInitialized) return;
    
    const knex = await initDatabase();
    const weapons = ALL_WEAPONS.map(weapon => ({ 
      name: weapon.name, 
      weapon_type: weapon.type,
      enabled: 1 
    }));
    
    await knex('weapons')
      .insert(weapons)
      .onConflict('name')
      .ignore();
    
    this.isInitialized = true;
  }

  /**
   * 有効な武器を取得
   * @param {string} [weaponType] - 武器種別でフィルタリング（オプション）
   */
  async getEnabledWeapons(weaponType = null) {
    await this.ensureInitialized();
    const knex = getKnex();
    
    const query = knex('weapons')
      .select('name', 'weapon_type')
      .where({ enabled: 1 })
      .orderBy('name');
    
    if (weaponType) {
      query.where({ weapon_type: weaponType });
    }
    
    const results = await query;
    return results.map(row => row.name);
  }

  /**
   * 除外されている武器を取得
   */
  async getDisabledWeapons() {
    await this.ensureInitialized();
    const knex = getKnex();
    
    const results = await knex('weapons')
      .select('name', 'weapon_type')
      .where({ enabled: 0 })
      .orderBy('name');
    
    return results.map(row => row.name);
  }

  /**
   * 全武器を取得
   * @param {string} [weaponType] - 武器種別でフィルタリング（オプション）
   */
  getAllWeapons(weaponType = null) {
    if (weaponType) {
      return ALL_WEAPONS.filter(w => w.type === weaponType).map(w => w.name);
    }
    return ALL_WEAPONS.map(w => w.name);
  }

  /**
   * 武器種別一覧を取得
   */
  getWeaponTypes() {
    return [...WEAPON_TYPES];
  }

  /**
   * 武器を除外リストに追加（enabledを0に）
   * @param {string} weaponName - 武器名
   */
  async disableWeapon(weaponName) {
    await this.ensureInitialized();
    const knex = getKnex();
    
    if (!ALL_WEAPONS.some(w => w.name === weaponName)) {
      return { success: false, message: 'その武器は存在しません' };
    }

    const changes = await knex('weapons')
      .where({ name: weaponName })
      .update({ enabled: 0 });
    
    if (changes === 0) {
      return { success: false, message: 'その武器は既に除外されています' };
    }

    return { success: true };
  }

  /**
   * 武器を有効化（除外リストから削除）
   * @param {string} weaponName - 武器名
   */
  async enableWeapon(weaponName) {
    await this.ensureInitialized();
    const knex = getKnex();
    
    if (!ALL_WEAPONS.some(w => w.name === weaponName)) {
      return { success: false, message: 'その武器は存在しません' };
    }

    const changes = await knex('weapons')
      .where({ name: weaponName })
      .update({ enabled: 1 });
    
    if (changes === 0) {
      return { success: false, message: 'その武器は既に有効化されています' };
    }

    return { success: true };
  }

  /**
   * 全ての武器を有効化（除外リストをクリア）
   */
  async enableAllWeapons() {
    await this.ensureInitialized();
    const knex = getKnex();
    
    const changes = await knex('weapons')
      .where({ enabled: 0 })
      .update({ enabled: 1 });
    
    return { success: true, count: changes };
  }

  /**
   * 武器種別を一括で除外
   * @param {string} weaponType - 武器種別
   */
  async disableWeaponType(weaponType) {
    await this.ensureInitialized();
    const knex = getKnex();
    
    if (!WEAPON_TYPES.includes(weaponType)) {
      return { success: false, message: 'その武器種別は存在しません' };
    }

    try {
      const changes = await knex('weapons')
        .where({ weapon_type: weaponType, enabled: 1 })
        .update({ enabled: 0 });
      
      if (changes === 0) {
        return { success: false, message: `${weaponType}の武器は既に全て除外されています` };
      }
      
      return { 
        success: true, 
        message: `${weaponType}の武器 ${changes}種類を除外リストに追加しました`, 
        count: changes 
      };
    } catch (error) {
      return { success: false, message: '武器種別の一括除外に失敗しました' };
    }
  }

  /**
   * 武器種別を一括で有効化
   * @param {string} weaponType - 武器種別
   */
  async enableWeaponType(weaponType) {
    await this.ensureInitialized();
    const knex = getKnex();
    
    if (!WEAPON_TYPES.includes(weaponType)) {
      return { success: false, message: 'その武器種別は存在しません' };
    }

    try {
      const changes = await knex('weapons')
        .where({ weapon_type: weaponType, enabled: 0 })
        .update({ enabled: 1 });
      
      if (changes === 0) {
        return { success: false, message: `${weaponType}の武器は除外リストにありません` };
      }
      
      return { 
        success: true, 
        message: `${weaponType}の武器 ${changes}種類を除外リストから削除しました`, 
        count: changes 
      };
    } catch (error) {
      return { success: false, message: '武器種別の一括有効化に失敗しました' };
    }
  }

  /**
   * 複数の武器を追加
   * @param {Array<{name: string, weapon_type: string}>} weapons - 追加する武器のリスト
   */
  async addWeapons(weapons) {
    await this.ensureInitialized();
    const knex = getKnex();
    
    const weaponRecords = weapons.map(w => ({
      name: w.name,
      weapon_type: w.weapon_type,
      enabled: 1
    }));
    
    await knex('weapons')
      .insert(weaponRecords)
      .onConflict('name')
      .ignore();
    
    return { success: true, count: weapons.length };
  }

  /**
   * 武器を削除
   * @param {string} weaponName - 武器名
   */
  async removeWeapon(weaponName) {
    await this.ensureInitialized();
    const knex = getKnex();
    
    const changes = await knex('weapons')
      .where({ name: weaponName })
      .delete();
    
    if (changes === 0) {
      return { success: false, message: 'その武器は存在しません' };
    }

    return { success: true };
  }
}

// シングルトンインスタンスをエクスポート（後方互換性のため）
const weaponRepository = new WeaponRepository();
export default weaponRepository;
