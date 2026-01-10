import { describe, it, expect, beforeEach } from 'vitest';
import weaponRepository from '../src/repositories/WeaponRepository.js';

describe('WeaponRepository', () => {
  beforeEach(async () => {
    await weaponRepository.enableAllWeapons();
  });

  describe('getAllWeapons', () => {
    it('全武器データを返す', () => {
      const weapons = weaponRepository.getAllWeapons();
      expect(weapons).toBeInstanceOf(Array);
      expect(weapons.length).toBeGreaterThan(0);
    });

    it('武器種別でフィルタリングできる', () => {
      const shooters = weaponRepository.getAllWeapons('シューター');
      expect(shooters).toBeInstanceOf(Array);
      expect(shooters.length).toBeGreaterThan(0);
    });
  });

  describe('getWeaponTypes', () => {
    it('全データを変更しない', () => {
      const types1 = weaponRepository.getWeaponTypes();
      const types2 = weaponRepository.getWeaponTypes();
      expect(types1).not.toBe(types2);
    });

    it('武器種別一覧を返す', () => {
      const types = weaponRepository.getWeaponTypes();
      expect(types).toContain('シューター');
      expect(types).toContain('フデ');
    });
  });

  describe('getEnabledWeapons', () => {
    it('有効な武器のみを返す', async () => {
      await weaponRepository.disableWeapon('わかばシューター');
      const enabled = await weaponRepository.getEnabledWeapons();
      expect(enabled).not.toContain('わかばシューター');
    });
  });

  describe('getDisabledWeapons', () => {
    it('除外された武器のみを返す', async () => {
      await weaponRepository.disableWeapon('わかばシューター');
      const disabled = await weaponRepository.getDisabledWeapons();
      expect(disabled).toContain('わかばシューター');
    });
  });

  describe('disableWeapon', () => {
    it('存在しない武器は除外できない', async () => {
      const result = await weaponRepository.disableWeapon('存在しない武器');
      expect(result.success).toBe(false);
    });
  });

  describe('disableWeaponType', () => {
    it('武器種別を一括で除外できる', async () => {
      const result = await weaponRepository.disableWeaponType('シューター');
      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe('enableWeapon', () => {
    it('武器を有効化できる', async () => {
      await weaponRepository.disableWeapon('わかばシューター');
      const result = await weaponRepository.enableWeapon('わかばシューター');
      expect(result.success).toBe(true);
    });
  });

  describe('enableWeaponType', () => {
    it('武器種別を一括で有効化できる', async () => {
      await weaponRepository.disableWeaponType('シューター');
      const result = await weaponRepository.enableWeaponType('シューター');
      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe('enableAllWeapons', () => {
    it('全ての武器を有効化できる', async () => {
      await weaponRepository.disableWeapon('わかばシューター');
      await weaponRepository.disableWeapon('スプラシューター');
      const result = await weaponRepository.enableAllWeapons();
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
    });
  });
});
