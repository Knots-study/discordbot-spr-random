import { describe, it, expect } from 'vitest';
import { ALL_WEAPONS, WEAPON_TYPES } from '../src/data/weapons.js';

describe('weapons data', () => {
  it('武器データが配列である', () => {
    expect(Array.isArray(ALL_WEAPONS)).toBe(true);
  });

  it('武器データが空でない', () => {
    expect(ALL_WEAPONS.length).toBeGreaterThan(0);
  });

  it('全ての武器がオブジェクトでnameとtypeプロパティを持つ', () => {
    ALL_WEAPONS.forEach(weapon => {
      expect(typeof weapon).toBe('object');
      expect(typeof weapon.name).toBe('string');
      expect(weapon.name.length).toBeGreaterThan(0);
      expect(typeof weapon.type).toBe('string');
      expect(weapon.type.length).toBeGreaterThan(0);
    });
  });

  it('重複する武器がない', () => {
    const weaponNames = ALL_WEAPONS.map(w => w.name);
    const uniqueWeapons = [...new Set(weaponNames)];
    expect(uniqueWeapons.length).toBe(ALL_WEAPONS.length);
  });

  it('空文字やnullが含まれていない', () => {
    ALL_WEAPONS.forEach(weapon => {
      expect(weapon.name).toBeTruthy();
      expect(weapon.name.trim()).toBe(weapon.name);
      expect(weapon.type).toBeTruthy();
      expect(weapon.type.trim()).toBe(weapon.type);
    });
  });

  it('期待される武器数が含まれている', () => {
    expect(ALL_WEAPONS.length).toBeGreaterThanOrEqual(100);
  });

  it('代表的な武器が含まれている', () => {
    const weaponNames = ALL_WEAPONS.map(w => w.name);
    expect(weaponNames).toContain('わかばシューター');
    expect(weaponNames).toContain('スプラシューター');
  });

  it('全ての武器種別が有効である', () => {
    ALL_WEAPONS.forEach(weapon => {
      expect(WEAPON_TYPES).toContain(weapon.type);
    });
  });
});

describe('weapon types', () => {
  it('武器種別データが配列である', () => {
    expect(Array.isArray(WEAPON_TYPES)).toBe(true);
  });

  it('武器種別データが空でない', () => {
    expect(WEAPON_TYPES.length).toBeGreaterThan(0);
  });

  it('期待される武器種別が含まれている', () => {
    expect(WEAPON_TYPES).toContain('シューター');
    expect(WEAPON_TYPES).toContain('フデ');
    expect(WEAPON_TYPES).toContain('ストリンガー');
  });
});
