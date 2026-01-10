import { describe, it, expect, vi, beforeEach } from 'vitest';
import randomCommand from '../../src/commands/random.js';
import weaponRepository from '../../src/repositories/WeaponRepository.js';
import * as reactionAdd from '../../src/events/reactionAdd.js';
import { REROLL_EMOJI, NUMBER_EMOJIS } from '../../src/utils/constants.js';
vi.mock('../../src/events/reactionAdd.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    registerMessageCreationTime: vi.fn()
  };
});
vi.mock('../../src/utils/weaponSelector.js', () => ({
  getHumanMembers: vi.fn(() => new Map([
    ['user1', { id: 'user1', displayName: 'User1' }],
    ['user2', { id: 'user2', displayName: 'User2' }]
  ])),
  selectRandomWeapons: vi.fn((weapons, count) => weapons.slice(0, count))
}));

describe('random command - タイマー統合', () => {
  let mockMessage;
  let mockVoiceChannel;
  let mockSentMessage;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue([
      '武器A', '武器B', '武器C', '武器D'
    ]);
    vi.spyOn(weaponRepository, 'getDisabledWeapons').mockResolvedValue([]);
    vi.spyOn(weaponRepository, 'getWeaponTypes').mockReturnValue(['シューター', 'ブラスター']);

    mockSentMessage = {
      id: 'sent-msg-123',
      react: vi.fn().mockResolvedValue({})
    };

    mockVoiceChannel = {
      members: new Map([
        ['user1', { id: 'user1', user: { bot: false }, displayName: 'User1' }],
        ['user2', { id: 'user2', user: { bot: false }, displayName: 'User2' }]
      ])
    };

    mockMessage = {
      member: {
        voice: {
          channel: mockVoiceChannel
        }
      },
      reply: vi.fn().mockResolvedValue(mockSentMessage),
      channel: {
        send: vi.fn().mockResolvedValue({})
      }
    };
  });

  describe('リアクション追加', () => {
    it('再抽選emojiが追加される', async () => {
      await randomCommand.execute(mockMessage, []);

      expect(mockSentMessage.react).toHaveBeenCalledWith(REROLL_EMOJI);
    });

    it('参加者数に応じた番号emojiが追加される', async () => {
      await randomCommand.execute(mockMessage, []);

      expect(mockSentMessage.react).toHaveBeenCalledWith(NUMBER_EMOJIS[0]);
      expect(mockSentMessage.react).toHaveBeenCalledWith(NUMBER_EMOJIS[1]);
      expect(mockSentMessage.react).not.toHaveBeenCalledWith(NUMBER_EMOJIS[2]);
    });

    it('10人以上の参加者でも最大10個の番号emojiのみ', async () => {
      const largeMembers = new Map();
      for (let i = 0; i < 15; i++) {
        largeMembers.set(`user${i}`, { 
          id: `user${i}`, 
          user: { bot: false },
          displayName: `User${i}`
        });
      }
      mockVoiceChannel.members = largeMembers;

      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => `武器${i}`)
      );

      const { getHumanMembers, selectRandomWeapons } = await import('../../src/utils/weaponSelector.js');
      getHumanMembers.mockReturnValue(largeMembers);
      selectRandomWeapons.mockImplementation((weapons, count) => weapons.slice(0, count));

      await randomCommand.execute(mockMessage, []);

      expect(mockSentMessage.react).toHaveBeenCalledTimes(11);
      expect(mockSentMessage.react).toHaveBeenCalledWith(NUMBER_EMOJIS[9]);
      expect(mockSentMessage.react).not.toHaveBeenCalledWith(NUMBER_EMOJIS[10]);
    });
  });

  describe('エラーケース', () => {
    it('ボイスチャンネル不参加時はタイマー記録しない', async () => {
      mockMessage.member.voice.channel = null;

      await randomCommand.execute(mockMessage, []);

      expect(reactionAdd.registerMessageCreationTime).not.toHaveBeenCalled();
    });

    it('利用可能な武器がない場合はタイマー記録しない', async () => {
      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue([]);

      await randomCommand.execute(mockMessage, []);

      expect(reactionAdd.registerMessageCreationTime).not.toHaveBeenCalled();
    });

    it('参加者が多すぎる場合はタイマー記録しない', async () => {
      vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(['武器A']);

      await randomCommand.execute(mockMessage, []);

      expect(reactionAdd.registerMessageCreationTime).not.toHaveBeenCalled();
    });

    it('無効な武器種別指定時はタイマー記録しない', async () => {
      await randomCommand.execute(mockMessage, ['存在しない種別']);

      expect(reactionAdd.registerMessageCreationTime).not.toHaveBeenCalled();
    });
  });
});
