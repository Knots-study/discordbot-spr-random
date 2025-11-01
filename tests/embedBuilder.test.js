import { describe, it, expect } from 'vitest';
import { createWeaponEmbed, createSimpleWeaponEmbed } from '../src/utils/embedBuilder.js';

describe('embedBuilder', () => {
  describe('createWeaponEmbed', () => {
    it('通常の武器選出Embedを作成', () => {
      const assignments = [
        { member: { id: 'user1' }, weapon: 'わかばシューター' },
        { member: { id: 'user2' }, weapon: 'スプラシューター' },
      ];

      const embed = createWeaponEmbed(assignments, 5, null, false);

      expect(embed.data.title).toBe('🎲 ランダム武器選出');
      expect(embed.data.color).toBe(0x4ECDC4);
      expect(embed.data.description).toContain('<@user1>');
      expect(embed.data.description).toContain('わかばシューター');
      expect(embed.data.footer.text).toContain('参加者: 2人');
      expect(embed.data.footer.text).toContain('除外中: 5個');
      expect(embed.data.footer.text).toContain('🔄');
    });

    it('再抽選の武器選出Embedを作成', () => {
      const assignments = [
        { member: { id: 'user1' }, weapon: 'わかばシューター' },
      ];

      const embed = createWeaponEmbed(assignments, 3, null, true);

      expect(embed.data.title).toBe('🎲 ランダム武器選出（再抽選）');
      expect(embed.data.footer.text).not.toContain('🔄');
    });

    it('武器種別を指定した場合のEmbedを作成', () => {
      const assignments = [
        { member: { id: 'user1' }, weapon: 'パブロ' },
      ];

      const embed = createWeaponEmbed(assignments, 0, 'フデ', false);

      expect(embed.data.title).toBe('🎲 ランダム武器選出（フデ）');
    });

    it('複数人の割り当てを正しく表示', () => {
      const assignments = [
        { member: { id: 'u1' }, weapon: 'A' },
        { member: { id: 'u2' }, weapon: 'B' },
        { member: { id: 'u3' }, weapon: 'C' },
      ];

      const embed = createWeaponEmbed(assignments, 0);

      expect(embed.data.description).toContain('1️⃣');
      expect(embed.data.description).toContain('2️⃣');
      expect(embed.data.description).toContain('3️⃣');
      expect(embed.data.description).toContain('<@u1>');
      expect(embed.data.description).toContain('**A**');
    });
  });

  describe('createSimpleWeaponEmbed', () => {
    it('シンプルな武器リストEmbedを作成', () => {
      const weapons = ['わかばシューター', 'スプラシューター'];

      const embed = createSimpleWeaponEmbed(weapons, 10);

      expect(embed.data.title).toBe('🎲 ランダム武器選出（再抽選）');
      expect(embed.data.description).toContain('**1.** わかばシューター');
      expect(embed.data.description).toContain('**2.** スプラシューター');
      expect(embed.data.footer.text).toBe('除外中: 10個');
      expect(embed.data.footer.text).not.toContain('🔄');
    });

    it('空の武器リストでも正常に動作', () => {
      const embed = createSimpleWeaponEmbed([], 0);

      expect(embed.data.description).toBe(undefined); // 空文字はundefinedになる
      expect(embed.data.footer.text).toBe('除外中: 0個');
    });
  });
});
