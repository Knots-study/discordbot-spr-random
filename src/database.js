import { initDatabase, getKnex } from './db/connection.js';
import { ALL_WEAPONS, WEAPON_TYPES } from './data/weapons.js';
import { DatabaseError } from './utils/errorHandler.js';

let isInitialized = false;

/**
 * 武器データを初期化（初回のみ実行）
 */
async function ensureInitialized() {
  if (isInitialized) return;
  
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
  
  isInitialized = true;
}

/**
 * 有効な武器を取得
 * @param {string} [weaponType] - 武器種別でフィルタリング（オプション）
 */
export async function getEnabledWeapons(weaponType = null) {
  await ensureInitialized();
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
export async function getDisabledWeapons() {
  await ensureInitialized();
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
export function getAllWeapons(weaponType = null) {
  if (weaponType) {
    return ALL_WEAPONS.filter(w => w.type === weaponType).map(w => w.name);
  }
  return ALL_WEAPONS.map(w => w.name);
}

/**
 * 武器種別一覧を取得
 */
export function getWeaponTypes() {
  return [...WEAPON_TYPES];
}

/**
 * 武器を除外リストに追加（enabledを0に）
 * @param {string} weaponName - 武器名
 */
export async function disableWeapon(weaponName) {
  await ensureInitialized();
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
  
  return { success: true, message: '武器を除外リストに追加しました' };
}

/**
 * 武器種別を一括で除外リストに追加（トランザクション使用）
 * @param {string} weaponType - 武器種別
 */
export async function disableWeaponType(weaponType) {
  await ensureInitialized();
  const knex = getKnex();
  
  if (!WEAPON_TYPES.includes(weaponType)) {
    return { success: false, message: 'その武器種別は存在しません' };
  }

  try {
    // トランザクション開始
    const result = await knex.transaction(async (trx) => {
      const changes = await trx('weapons')
        .where({ weapon_type: weaponType, enabled: 1 })
        .update({ enabled: 0 });
      
      if (changes === 0) {
        throw new DatabaseError(`${weaponType}の武器は既に全て除外されています`);
      }
      
      return { changes };
    });
    
    return { 
      success: true, 
      message: `${weaponType}の武器 ${result.changes}種類を除外リストに追加しました`, 
      count: result.changes 
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return { success: false, message: error.message };
    }
    throw new DatabaseError('武器種別の一括除外に失敗しました', error);
  }
}

/**
 * 武器を除外リストから削除（enabledを1に）
 * @param {string} weaponName - 武器名
 */
export async function enableWeapon(weaponName) {
  await ensureInitialized();
  const knex = getKnex();
  
  const changes = await knex('weapons')
    .where({ name: weaponName })
    .update({ enabled: 1 });
  
  if (changes === 0) {
    return { success: false, message: 'その武器は除外リストにありません' };
  }
  
  return { success: true, message: '武器を除外リストから削除しました' };
}

/**
 * 武器種別を一括で除外リストから削除（トランザクション使用）
 * @param {string} weaponType - 武器種別
 */
export async function enableWeaponType(weaponType) {
  await ensureInitialized();
  const knex = getKnex();
  
  if (!WEAPON_TYPES.includes(weaponType)) {
    return { success: false, message: 'その武器種別は存在しません' };
  }

  try {
    // トランザクション開始
    const result = await knex.transaction(async (trx) => {
      const changes = await trx('weapons')
        .where({ weapon_type: weaponType, enabled: 0 })
        .update({ enabled: 1 });
      
      if (changes === 0) {
        throw new DatabaseError(`${weaponType}の武器は除外リストにありません`);
      }
      
      return { changes };
    });
    
    return { 
      success: true, 
      message: `${weaponType}の武器 ${result.changes}種類を除外リストから削除しました`, 
      count: result.changes 
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return { success: false, message: error.message };
    }
    throw new DatabaseError('武器種別の一括有効化に失敗しました', error);
  }
}

/**
 * 除外リストをクリア（トランザクション使用）
 */
export async function clearDisabledWeapons() {
  await ensureInitialized();
  const knex = getKnex();
  
  try {
    const result = await knex.transaction(async (trx) => {
      const changes = await trx('weapons')
        .where({ enabled: 0 })
        .update({ enabled: 1 });
      
      return { changes };
    });
    
    return { success: true, count: result.changes };
  } catch (error) {
    throw new DatabaseError('除外リストのクリアに失敗しました', error);
  }
}

/**
 * 複数の武器を一括操作（トランザクション使用）
 * @param {Array<string>} weaponNames - 武器名の配列
 * @param {boolean} enable - true: 有効化, false: 無効化
 */
export async function bulkUpdateWeapons(weaponNames, enable = true) {
  await ensureInitialized();
  const knex = getKnex();
  
  if (!weaponNames || weaponNames.length === 0) {
    return { success: false, message: '武器が指定されていません' };
  }

  try {
    const result = await knex.transaction(async (trx) => {
      const changes = await trx('weapons')
        .whereIn('name', weaponNames)
        .update({ enabled: enable ? 1 : 0 });
      
      return { changes };
    });
    
    const action = enable ? '有効化' : '除外';
    return { 
      success: true, 
      message: `${result.changes}種類の武器を${action}しました`,
      count: result.changes 
    };
  } catch (error) {
    throw new DatabaseError('武器の一括操作に失敗しました', error);
  }
}
