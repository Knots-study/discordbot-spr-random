import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleReaction from '../../src/events/reactionAdd.js';
import * as database from '../../src/database.js';
import { REROLL_EMOJI, NUMBER_EMOJIS } from '../../src/utils/constants.js';

// モック設定
vi.mock('../../src/database.js');
vi.mock('../../src/utils/weaponSelector.js', () => ({
  getHumanMembers: vi.fn(() => new Map([
    ['user1', { id: 'user1', user: { bot: false } }],
    ['user2', { id: 'user2', user: { bot: false } }]
  ])),
  selectRandomWeapons: vi.fn((weapons, count) => weapons.slice(0, count))
}));

describe('reactionAdd event handler', () => {
  let mockReaction;
  let mockUser;
  let mockClient;
  let mockMessage;
  let mockChannel;

  beforeEach(() => {
    // モッククリア
    vi.clearAllMocks();

    // データベースモック
    vi.spyOn(database, 'getEnabledWeapons').mockResolvedValue(['武器A', '武器B', '武器C']);
    vi.spyOn(database, 'getDisabledWeapons').mockResolvedValue([]);
    vi.spyOn(database, 'disableWeapon').mockResolvedValue(true);

    // チャンネルモック
    mockChannel = {
      send: vi.fn().mockResolvedValue({
        delete: vi.fn().mockResolvedValue(undefined)
      })
    };

    // メッセージモック
    mockMessage = {
      id: 'message123', // メッセージIDを追加
      author: { id: 'bot123' },
      guild: {
        members: {
          fetch: vi.fn().mockResolvedValue({
            voice: { 
              channel: {
                members: new Map([
                  ['user1', { id: 'user1', user: { bot: false } }],
                  ['user2', { id: 'user2', user: { bot: false } }]
                ])
              }
            }
          })
        }
      },
      embeds: [{
        title: '🎲 ランダム武器選出',
        description: '1️⃣ <@user1> → **わかばシューター**\n2️⃣ <@user2> → **スプラシューター**'
      }],
      edit: vi.fn().mockResolvedValue(undefined),
      channel: mockChannel
    };

    // リアクションモック
    mockReaction = {
      partial: false,
      emoji: { name: REROLL_EMOJI },
      message: mockMessage,
      users: {
        remove: vi.fn().mockResolvedValue(undefined)
      },
      remove: vi.fn().mockResolvedValue(undefined),
      fetch: vi.fn().mockResolvedValue(undefined)
    };

    // ユーザーモック
    mockUser = {
      id: 'user123',
      bot: false
    };

    // クライアントモック
    mockClient = {
      user: { id: 'bot123' }
    };
  });

  describe('基本動作', () => {
    it('Botのリアクションは無視される', async () => {
      mockUser.bot = true;

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(mockReaction.users.remove).not.toHaveBeenCalled();
    });

    it('Bot以外のメッセージのリアクションは無視される', async () => {
      mockMessage.author.id = 'other-bot';

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(mockReaction.users.remove).not.toHaveBeenCalled();
    });

    it('部分的なリアクションはフェッチされる', async () => {
      mockReaction.partial = true;

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(mockReaction.fetch).toHaveBeenCalled();
    });
  });

  describe('リロール機能', () => {
    it('リロールemojiでリロール処理が実行される', async () => {
      mockReaction.emoji.name = REROLL_EMOJI;

      await handleReaction(mockReaction, mockUser, mockClient);

      // ユーザーリアクションは削除される
      expect(mockReaction.users.remove).toHaveBeenCalledWith(mockUser.id);
      // 初回なので処理される
      expect(mockReaction.users.remove).toHaveBeenCalled();
    });

    it('2回目の再抽選は拒否される', async () => {
      mockReaction.emoji.name = REROLL_EMOJI;

      // 1回目の再抽選
      await handleReaction(mockReaction, mockUser, mockClient);

      // 2回目の再抽選（即座に）
      await handleReaction(mockReaction, mockUser, mockClient);
      
      // エラーメッセージが送信される
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('1回のみ可能です')
      );
    });

    it('20秒経過後の再抽選は拒否される', async () => {
      mockReaction.emoji.name = REROLL_EMOJI;

      // 初回のreactionで時刻を記録
      await handleReaction(mockReaction, mockUser, mockClient);

      // 21秒経過をシミュレート（Date.nowをモック）
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 21000);

      // 2回目の再抽選試行（新しいユーザーとして）
      mockReaction.users.remove.mockClear();
      await handleReaction(mockReaction, { id: 'user456', bot: false }, mockClient);
      
      // エラーメッセージが送信される
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('20秒以内のみ可能です')
      );
      
      // 元に戻す
      Date.now = originalDateNow;
    });
  });

  describe('番号リアクション（武器除外）', () => {
    it('1番emojiで1番目の武器が除外される', async () => {
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(database.disableWeapon).toHaveBeenCalledWith('わかばシューター');
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('わかばシューター')
      );
      expect(mockReaction.users.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('2番emojiで2番目の武器が除外される', async () => {
      mockReaction.emoji.name = NUMBER_EMOJIS[1];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(database.disableWeapon).toHaveBeenCalledWith('スプラシューター');
    });

    it('範囲外の番号emojiは無視される', async () => {
      mockReaction.emoji.name = NUMBER_EMOJIS[5]; // 6番目（存在しない）
      mockMessage.embeds[0].description = '1️⃣ <@user1> → **武器A**'; // 1つだけ

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(database.disableWeapon).not.toHaveBeenCalled();
    });

    it('除外失敗時はフィードバックメッセージを送らない', async () => {
      vi.spyOn(database, 'disableWeapon').mockResolvedValue(false);
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(mockChannel.send).not.toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    it('Embedが存在しない場合は何もしない', async () => {
      mockMessage.embeds = [];
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(database.disableWeapon).not.toHaveBeenCalled();
    });

    it('Embedのdescriptionが空の場合は何もしない', async () => {
      mockMessage.embeds[0].description = '';
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(database.disableWeapon).not.toHaveBeenCalled();
    });

    it('武器名が抽出できない形式の場合は何もしない', async () => {
      mockMessage.embeds[0].description = '無効な形式のテキスト';
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(database.disableWeapon).not.toHaveBeenCalled();
    });

    it('対応していないemojiは無視される', async () => {
      mockReaction.emoji.name = '❌';

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(mockReaction.users.remove).not.toHaveBeenCalled();
      expect(database.disableWeapon).not.toHaveBeenCalled();
    });
  });
});
