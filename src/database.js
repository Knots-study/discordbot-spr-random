import { initDatabase, getKnex } from './db/connection.js';
import { ALL_WEAPONS, WEAPON_TYPES } from './data/weapons.js';

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
  
  let query = knex('weapons')
    .select('name', 'weapon_type')
    .where({ enabled: 1 });
  
  if (weaponType) {
    query = query.where({ weapon_type: weaponType });
  }
  
  const results = await query.orderBy('name');
  
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
  
  if (!ALL_WEAPONS.map(w => w.name).includes(weaponName)) {
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
 * 武器種別を一括で除外リストに追加
 * @param {string} weaponType - 武器種別
 */
export async function disableWeaponType(weaponType) {
  await ensureInitialized();
  const knex = getKnex();
  
  if (!WEAPON_TYPES.includes(weaponType)) {
    return { success: false, message: 'その武器種別は存在しません' };
  }

  const changes = await knex('weapons')
    .where({ weapon_type: weaponType, enabled: 1 })
    .update({ enabled: 0 });
  
  if (changes === 0) {
    return { success: false, message: `${weaponType}の武器は既に全て除外されています` };
  }
  
  return { success: true, message: `${weaponType}の武器 ${changes}種類を除外リストに追加しました`, count: changes };
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
 * 武器種別を一括で除外リストから削除
 * @param {string} weaponType - 武器種別
 */
export async function enableWeaponType(weaponType) {
  await ensureInitialized();
  const knex = getKnex();
  
  if (!WEAPON_TYPES.includes(weaponType)) {
    return { success: false, message: 'その武器種別は存在しません' };
  }

  const changes = await knex('weapons')
    .where({ weapon_type: weaponType, enabled: 0 })
    .update({ enabled: 1 });
  
  if (changes === 0) {
    return { success: false, message: `${weaponType}の武器は除外リストにありません` };
  }
  
  return { success: true, message: `${weaponType}の武器 ${changes}種類を除外リストから削除しました`, count: changes };
}

/**
 * 除外リストをクリア
 */
export async function clearDisabledWeapons() {
  await ensureInitialized();
  const knex = getKnex();
  
  const changes = await knex('weapons')
    .update({ enabled: 1 });
  
  return { success: true, count: changes };
}
