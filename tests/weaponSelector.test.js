import { describe, it, expect } from 'vitest';
import { selectRandomWeapons, getHumanMembers } from '../src/utils/weaponSelector.js';
import { createMockMembers } from './helpers/mockFactory.js';

describe('weaponSelector', () => {
  describe('selectRandomWeapons', () => {
    it('指定された数の武器を返す', () => {
      const weapons = ['武器A', '武器B', '武器C', '武器D', '武器E'];
      const result = selectRandomWeapons(weapons, 3);
      
      expect(result).toHaveLength(3);
    });

    it('元の配列を変更しない', () => {
      const weapons = ['武器A', '武器B', '武器C'];
      const original = [...weapons];
      
      selectRandomWeapons(weapons, 2);
      
      expect(weapons).toEqual(original);
    });

    it('重複なく武器を選出する', () => {
      const weapons = ['武器A', '武器B', '武器C', '武器D'];
      const result = selectRandomWeapons(weapons, 4);
      const uniqueResult = [...new Set(result)];
      
      expect(uniqueResult).toHaveLength(4);
    });

    it('空の配列から選出すると空配列を返す', () => {
      const result = selectRandomWeapons([], 0);
      
      expect(result).toEqual([]);
    });

    it('全武器を選出できる', () => {
      const weapons = ['武器A', '武器B'];
      const result = selectRandomWeapons(weapons, 2);
      
      expect(result).toHaveLength(2);
      expect(weapons).toContain(result[0]);
      expect(weapons).toContain(result[1]);
    });
  });

  describe('getHumanMembers', () => {
    it('Bot以外のメンバーのみを返す', () => {
      const mockMembers = createMockMembers([
        ['user1', { user: { bot: false } }],
        ['bot1', { user: { bot: true } }],
        ['user2', { user: { bot: false } }],
      ]);
      
      const mockVoiceChannel = { members: mockMembers };
      const result = getHumanMembers(mockVoiceChannel);
      
      expect(result.size).toBe(2);
      expect(result.has('user1')).toBe(true);
      expect(result.has('user2')).toBe(true);
      expect(result.has('bot1')).toBe(false);
    });

    it('全員がBotの場合は空を返す', () => {
      const mockMembers = createMockMembers([
        ['bot1', { user: { bot: true } }],
        ['bot2', { user: { bot: true } }],
      ]);
      
      const mockVoiceChannel = { members: mockMembers };
      const result = getHumanMembers(mockVoiceChannel);
      
      expect(result.size).toBe(0);
    });

    it('メンバーがいない場合は空を返す', () => {
      const mockMembers = createMockMembers([]);
      
      const mockVoiceChannel = { members: mockMembers };
      const result = getHumanMembers(mockVoiceChannel);
      
      expect(result.size).toBe(0);
    });
  });
});
