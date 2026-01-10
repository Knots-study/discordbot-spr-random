import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  RerollStrategy,
  VoiceChannelRerollStrategy, 
  SimpleRerollStrategy 
} from '../../../src/events/strategies/RerollStrategy.js';
import weaponRepository from '../../../src/repositories/WeaponRepository.js';

vi.mock('../../../src/utils/weaponSelector.js', () => ({
  getHumanMembers: vi.fn(() => new Map([
    ['user1', { id: 'user1', user: { bot: false } }]
  ])),
  selectRandomWeapons: vi.fn((weapons, count) => weapons.slice(0, count))
}));

describe('RerollStrategy', () => {
  describe('RerollStrategy (基底クラス)', () => {
    it('execute()を実装していない場合はエラー', async () => {
      const strategy = new RerollStrategy();
      await expect(strategy.execute({})).rejects.toThrow('execute() must be implemented');
    });

    it('extractWeaponTypeFromTitle: 【シューター】形式から武器種別を抽出', () => {
      const strategy = new RerollStrategy();
      const result = strategy.extractWeaponTypeFromTitle('🎲 【シューター】ランダム武器選出');
      expect(result).toBe('シューター');
    });

    it('extractWeaponTypeFromTitle: 武器種別がない場合はnull', () => {
      const strategy = new RerollStrategy();
      const result = strategy.extractWeaponTypeFromTitle('🎲 ランダム武器選出');
      expect(result).toBeNull();
    });

    it('extractWeaponTypeFromTitle: 【再抽選】の場合はnull', () => {
      const strategy = new RerollStrategy();
      const result = strategy.extractWeaponTypeFromTitle('🎲 【再抽選】ランダム武器選出');
      expect(result).toBeNull();
    });
  });

  describe('VoiceChannelRerollStrategy', () => {
    let strategy;
    let mockMessage;
    let mockVoiceChannel;

    beforeEach(() => {
      vi.clearAllMocks();

      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(['武器A', '武器B', '武器C']);
      vi.spyOn(weaponRepository, 'getDisabledWeapons').mockResolvedValue([]);

      mockVoiceChannel = {
        members: new Map([
          ['user1', { id: 'user1', user: { bot: false } }]
        ])
      };

      mockMessage = {
        embeds: [{
          title: '🎲 ランダム武器選出',
          description: '1️⃣ <@user1> → **武器A**'
        }],
        edit: vi.fn().mockResolvedValue({})
      };

      strategy = new VoiceChannelRerollStrategy(mockVoiceChannel);
    });

    it('ボイスチャンネルのメンバーに武器を再割り当て', async () => {
      await strategy.execute(mockMessage);

      expect(weaponRepository.getEnabledWeapons).toHaveBeenCalled();
      expect(mockMessage.edit).toHaveBeenCalled();
      
      const editCall = mockMessage.edit.mock.calls[0][0];
      expect(editCall.embeds).toBeDefined();
      expect(editCall.embeds[0]).toBeDefined();
      expect(editCall.embeds[0].data).toBeDefined();
    });

    it('武器種別を考慮して再抽選', async () => {
      mockMessage.embeds[0].title = '🎲 【シューター】ランダム武器選出';

      await strategy.execute(mockMessage);

      expect(weaponRepository.getEnabledWeapons).toHaveBeenCalledWith('シューター');
    });

    it('メンバーが0人の場合は何もしない', async () => {
      const { getHumanMembers } = await import('../../../src/utils/weaponSelector.js');
      getHumanMembers.mockReturnValue(new Map());

      await strategy.execute(mockMessage);

      expect(mockMessage.edit).not.toHaveBeenCalled();
    });

    it('利用可能な武器がない場合は何もしない', async () => {
      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue([]);

      await strategy.execute(mockMessage);

      expect(mockMessage.edit).not.toHaveBeenCalled();
    });

    it('メンバーが武器数より多い場合は何もしない', async () => {
      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(['武器A']);
      const { getHumanMembers } = await import('../../../src/utils/weaponSelector.js');
      getHumanMembers.mockReturnValue(new Map([
        ['user1', {}],
        ['user2', {}]
      ]));

      await strategy.execute(mockMessage);

      expect(mockMessage.edit).not.toHaveBeenCalled();
    });
  });

  describe('SimpleRerollStrategy', () => {
    let strategy;
    let mockMessage;

    beforeEach(() => {
      vi.clearAllMocks();

      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(['武器A', '武器B', '武器C']);
      vi.spyOn(weaponRepository, 'getDisabledWeapons').mockResolvedValue([]);

      mockMessage = {
        embeds: [{
          title: '🎲 ランダム武器選出',
          description: '武器A\n武器B'
        }],
        edit: vi.fn().mockResolvedValue({})
      };

      strategy = new SimpleRerollStrategy();
    });

    it('embedの行数に応じて武器を再抽選', async () => {
      await strategy.execute(mockMessage);

      expect(weaponRepository.getEnabledWeapons).toHaveBeenCalled();
      expect(mockMessage.edit).toHaveBeenCalled();
      
      const editCall = mockMessage.edit.mock.calls[0][0];
      expect(editCall.embeds).toBeDefined();
      expect(editCall.embeds[0]).toBeDefined();
      expect(editCall.embeds[0].data).toBeDefined();
    });

    it('embedがない場合は何もしない', async () => {
      mockMessage.embeds = [];

      await strategy.execute(mockMessage);

      expect(mockMessage.edit).not.toHaveBeenCalled();
    });

    it('descriptionがない場合は何もしない', async () => {
      mockMessage.embeds[0].description = null;

      await strategy.execute(mockMessage);

      expect(mockMessage.edit).not.toHaveBeenCalled();
    });

    it('利用可能な武器がない場合は何もしない', async () => {
      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue([]);

      await strategy.execute(mockMessage);

      expect(mockMessage.edit).not.toHaveBeenCalled();
    });

    it('必要な武器数より利用可能な武器が少ない場合は何もしない', async () => {
      mockMessage.embeds[0].description = '武器A\n武器B\n武器C\n武器D\n武器E';
      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(['武器A', '武器B']);

      await strategy.execute(mockMessage);

      expect(mockMessage.edit).not.toHaveBeenCalled();
    });
  });

  describe('Strategy パターンの利点', () => {
    it('戦略を動的に切り替え可能', async () => {
      const mockMessage = {
        embeds: [{ description: '武器A\n武器B' }],
        edit: vi.fn().mockResolvedValue({})
      };

      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(['武器X', '武器Y', '武器Z']);
      vi.spyOn(weaponRepository, 'getDisabledWeapons').mockResolvedValue([]);

      // 戦略1: シンプル再抽選
      const strategy1 = new SimpleRerollStrategy();
      await strategy1.execute(mockMessage);
      expect(mockMessage.edit).toHaveBeenCalledTimes(1);

      // 戦略2: ボイスチャンネル再抽選
      mockMessage.edit.mockClear();
      const mockVoiceChannel = {
        members: new Map([['user1', { id: 'user1', user: { bot: false } }]])
      };
      const strategy2 = new VoiceChannelRerollStrategy(mockVoiceChannel);
      await strategy2.execute(mockMessage);
      expect(mockMessage.edit).toHaveBeenCalledTimes(1);

      // 両方とも異なる戦略で実行されたことを確認
      expect(strategy1).toBeInstanceOf(SimpleRerollStrategy);
      expect(strategy2).toBeInstanceOf(VoiceChannelRerollStrategy);
    });

    it('新しい戦略を追加しても既存コードに影響しない（Open/Closed原則）', () => {
      // 新しい戦略クラスを定義できることを確認
      class CustomRerollStrategy extends RerollStrategy {
        async execute(message) {
          // カスタムロジック
          return;
        }
      }

      const customStrategy = new CustomRerollStrategy();
      expect(customStrategy).toBeInstanceOf(RerollStrategy);
      expect(customStrategy.execute).toBeDefined();
    });
  });
});
