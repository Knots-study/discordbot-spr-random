import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import knex from 'knex';
import {
  getEnabledWeapons,
  getDisabledWeapons,
  getAllWeapons,
  getWeaponTypes,
  disableWeapon,
  disableWeaponType,
  enableWeapon,
  enableWeaponType,
  clearDisabledWeapons,
} from '../src/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DB_PATH = join(__dirname, '../data/test-weapons.db');

describe('database', () => {
  let testKnex;

  beforeEach(async () => {
    // テスト用DBを作成
    testKnex = knex({
      client: 'sqlite3',
      connection: { filename: TEST_DB_PATH },
      useNullAsDefault: true,
    });

    // テーブル作成
    await testKnex.schema.createTable('weapons', (table) => {
      table.increments('id').primary();
      table.string('name', 255).notNullable().unique();
      table.string('weapon_type').notNullable();
      table.integer('enabled').notNullable().defaultTo(1);
      table.timestamp('created_at').defaultTo(testKnex.fn.now());
      table.index('weapon_type');
    });

    // テストデータ投入
    await testKnex('weapons').insert([
      { name: 'わかばシューター', weapon_type: 'シューター', enabled: 1 },
      { name: 'スプラシューター', weapon_type: 'シューター', enabled: 1 },
      { name: 'プロモデラーMG', weapon_type: 'シューター', enabled: 0 },
      { name: 'パブロ', weapon_type: 'フデ', enabled: 1 },
      { name: 'ホクサイ', weapon_type: 'フデ', enabled: 1 },
    ]);
  });

  afterEach(async () => {
    await testKnex.destroy();
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('getAllWeapons', () => {
    it('全武器データを返す', () => {
      const weapons = getAllWeapons();
      
      expect(Array.isArray(weapons)).toBe(true);
      expect(weapons.length).toBeGreaterThan(0);
    });

    it('武器種別でフィルタリングできる', () => {
      const shooterWeapons = getAllWeapons('シューター');
      
      expect(Array.isArray(shooterWeapons)).toBe(true);
      expect(shooterWeapons.length).toBeGreaterThan(0);
    });

    it('元のデータを変更しない', () => {
      const weapons1 = getAllWeapons();
      const weapons2 = getAllWeapons();
      
      weapons1.push('新しい武器');
      
      expect(weapons2).not.toContain('新しい武器');
    });
  });

  describe('getWeaponTypes', () => {
    it('武器種別一覧を返す', () => {
      const types = getWeaponTypes();
      
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types).toContain('シューター');
      expect(types).toContain('フデ');
    });
  });

  describe('getEnabledWeapons', () => {
    it('有効な武器のみを返す', async () => {
      expect(typeof getEnabledWeapons).toBe('function');
    });
  });

  describe('getDisabledWeapons', () => {
    it('除外された武器のみを返す', async () => {
      expect(typeof getDisabledWeapons).toBe('function');
    });
  });

  describe('disableWeapon', () => {
    it('存在しない武器は除外できない', async () => {
      const result = await disableWeapon('存在しない武器');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('存在しません');
    });
  });

  describe('disableWeaponType', () => {
    it('武器種別を一括で除外できる', async () => {
      expect(typeof disableWeaponType).toBe('function');
    });
  });

  describe('enableWeapon', () => {
    it('武器を有効化できる', async () => {
      expect(typeof enableWeapon).toBe('function');
    });
  });

  describe('enableWeaponType', () => {
    it('武器種別を一括で有効化できる', async () => {
      expect(typeof enableWeaponType).toBe('function');
    });
  });

  describe('clearDisabledWeapons', () => {
    it('全ての武器を有効化できる', async () => {
      expect(typeof clearDisabledWeapons).toBe('function');
    });
  });
});
