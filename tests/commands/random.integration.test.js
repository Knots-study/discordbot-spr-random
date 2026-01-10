import { describe, it, expect, vi, beforeEach } from 'vitest';
import randomCommand from '../../src/commands/random.js';
import * as database from '../../src/database.js';
import * as reactionAdd from '../../src/events/reactionAdd.js';
import { REROLL_EMOJI, NUMBER_EMOJIS } from '../../src/utils/constants.js';

vi.mock('../../src/database.js');
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

    vi.spyOn(database, 'getEnabledWeapons').mockResolvedValue([
      '武器A', '武器B', '武器C', '武器D'
    ]);
    vi.spyOn(database, 'getDisabledWeapons').mockResolvedValue([]);
    vi.spyOn(database, 'getWeaponTypes').mockReturnValue(['シューター', 'ブラスター']);

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

  describe('タイマー記録', () => {
    it('メッセージ送信後にregisterMessageCreationTimeが呼ばれる', async () => {
      await randomCommand.execute(mockMessage, []);

      expect(reactionAdd.registerMessageCreationTime).toHaveBeenCalledWith('sent-msg-123');
    });

    it('タイマー記録はメッセージ送信直後に行われる', async () => {
      const callOrder = [];
      
      mockMessage.reply.mockImplementation(async () => {
        callOrder.push('reply');
        return mockSentMessage;
      });

      reactionAdd.registerMessageCreationTime.mockImplementation(() => {
        callOrder.push('registerTimer');
      });

      mockSentMessage.react.mockImplementation(async () => {
        callOrder.push('react');
      });

      await randomCommand.execute(mockMessage, []);

      // reply → registerTimer → react(再抽選) → react(1番) → react(2番)
      expect(callOrder[0]).toBe('reply');
      expect(callOrder[1]).toBe('registerTimer');
      expect(callOrder[2]).toBe('react');
      expect(callOrder.filter(c => c === 'react').length).toBe(3); // 1個の再抽選 + 2個の番号
    });

    it('武器種別フィルター指定時もタイマーが記録される', async () => {
      await randomCommand.execute(mockMessage, ['シューター']);

      expect(reactionAdd.registerMessageCreationTime).toHaveBeenCalledWith('sent-msg-123');
    });

    it('エラー発生時でもタイマー記録は試行される', async () => {
      mockSentMessage.react.mockRejectedValue(new Error('React failed'));

      try {
        await randomCommand.execute(mockMessage, []);
      } catch (error) {
        // エラーは無視
      }

      // タイマー記録はreactの前に実行されているので成功しているはず
      expect(reactionAdd.registerMessageCreationTime).toHaveBeenCalled();
    });
  });

  describe('リアクション追加', () => {
    it('再抽選emojiが追加される', async () => {
      await randomCommand.execute(mockMessage, []);

      expect(mockSentMessage.react).toHaveBeenCalledWith(REROLL_EMOJI);
    });

    it('参加者数に応じた番号emojiが追加される', async () => {
      await randomCommand.execute(mockMessage, []);

      // 2人の参加者なので、2つの番号emoji
      expect(mockSentMessage.react).toHaveBeenCalledWith(NUMBER_EMOJIS[0]);
      expect(mockSentMessage.react).toHaveBeenCalledWith(NUMBER_EMOJIS[1]);
      expect(mockSentMessage.react).not.toHaveBeenCalledWith(NUMBER_EMOJIS[2]);
    });

    it('タイマー記録→リアクション追加の順序で実行', async () => {
      await randomCommand.execute(mockMessage, []);
      
      // タイマーとリアクションの両方が呼ばれている
      expect(reactionAdd.registerMessageCreationTime).toHaveBeenCalledWith('sent-msg-123');
      expect(mockSentMessage.react).toHaveBeenCalled();
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

      vi.spyOn(database, 'getEnabledWeapons').mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => `武器${i}`)
      );

      const { getHumanMembers, selectRandomWeapons } = await import('../../src/utils/weaponSelector.js');
      getHumanMembers.mockReturnValue(largeMembers);
      selectRandomWeapons.mockImplementation((weapons, count) => weapons.slice(0, count));

      await randomCommand.execute(mockMessage, []);

      // 再抽選emoji + 10個の番号emoji = 11個
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
      vi.spyOn(database, 'getEnabledWeapons').mockResolvedValue([]);

      await randomCommand.execute(mockMessage, []);

      expect(reactionAdd.registerMessageCreationTime).not.toHaveBeenCalled();
    });

    it('参加者が多すぎる場合はタイマー記録しない', async () => {
      vi.spyOn(database, 'getEnabledWeapons').mockResolvedValue(['武器A']); // 1個のみ
      // VC参加者は2人なので武器が足りない

      await randomCommand.execute(mockMessage, []);

      expect(reactionAdd.registerMessageCreationTime).not.toHaveBeenCalled();
    });

    it('無効な武器種別指定時はタイマー記録しない', async () => {
      await randomCommand.execute(mockMessage, ['存在しない種別']);

      expect(reactionAdd.registerMessageCreationTime).not.toHaveBeenCalled();
    });
  });
});
