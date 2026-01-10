import weaponRepository from './repositories/WeaponRepository.js';
import { WEAPON_TYPES } from './data/weapons.js';

/**
 * 後方互換性のためのラッパー関数
 * 新しいコードではWeaponRepositoryを直接使用してください
 * @deprecated このモジュールは非推奨です。repositories/WeaponRepository.jsを使用してください
 */

/**
 * 有効な武器を取得
 * @param {string} [weaponType] - 武器種別でフィルタリング（オプション）
 */
export async function getEnabledWeapons(weaponType = null) {
  return weaponRepository.getEnabledWeapons(weaponType);
}

/**
 * 除外されている武器を取得
 */
export async function getDisabledWeapons() {
  return weaponRepository.getDisabledWeapons();
}

/**
 * 全武器を取得
 * @param {string} [weaponType] - 武器種別でフィルタリング（オプション）
 */
export function getAllWeapons(weaponType = null) {
  return weaponRepository.getAllWeapons(weaponType);
}

/**
 * 武器種別一覧を取得
 */
export function getWeaponTypes() {
  return weaponRepository.getWeaponTypes();
}

/**
 * 武器を除外リストに追加（enabledを0に）
 * @param {string} weaponName - 武器名
 */
export async function disableWeapon(weaponName) {
  return weaponRepository.disableWeapon(weaponName);
}

/**
 * 武器種別を一括で除外
 * @param {string} weaponType - 武器種別
 */
export async function disableWeaponType(weaponType) {
  return weaponRepository.disableWeaponType(weaponType);
}

/**
 * 武器を除外リストから削除（enabledを1に）
 * @param {string} weaponName - 武器名
 */
export async function enableWeapon(weaponName) {
  return weaponRepository.enableWeapon(weaponName);
}

/**
 * 武器種別を一括で有効化
 * @param {string} weaponType - 武器種別
 */
export async function enableWeaponType(weaponType) {
  return weaponRepository.enableWeaponType(weaponType);
}

/**
 * 除外リストをクリア
 */
export async function clearDisabledWeapons() {
  return weaponRepository.enableAllWeapons();
}
