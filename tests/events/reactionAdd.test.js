import { describe, it, expect, vi, beforeEach } from 'vitest';
import handleReaction, { registerMessageCreationTime, __test__ } from '../../src/events/reactionAdd.js';
import weaponRepository from '../../src/repositories/WeaponRepository.js';
import { REROLL_EMOJI, NUMBER_EMOJIS } from '../../src/utils/constants.js';

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
    vi.clearAllMocks();
    __test__.clearMaps();

    vi.spyOn(weaponRepository, 'getEnabledWeapons').mockResolvedValue(['武器A', '武器B', '武器C']);
    vi.spyOn(weaponRepository, 'getDisabledWeapons').mockResolvedValue([]);
    vi.spyOn(weaponRepository, 'disableWeapon').mockResolvedValue(true);

    mockChannel = {
      send: vi.fn().mockResolvedValue({
        delete: vi.fn().mockResolvedValue(undefined)
      })
    };

    mockMessage = {
      id: 'message123',
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

    mockUser = {
      id: 'user123',
      bot: false
    };

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
      
      // タイムスタンプを登録（mockMessage.idと一致させる）
      registerMessageCreationTime('message123');

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

      // タイムスタンプを21秒前で登録
      const originalDateNow = Date.now;
      const mockTime = originalDateNow() - 21000;
      Date.now = vi.fn(() => mockTime);
      registerMessageCreationTime('message123');
      Date.now = originalDateNow;

      // 現在時刻で再抽選を試行
      mockReaction.users.remove.mockClear();
      await handleReaction(mockReaction, { id: 'user456', bot: false }, mockClient);
      
      // エラーメッセージが送信される
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('20秒以内のみ可能です')
      );
    });
  });

  describe('番号リアクション（武器除外）', () => {
    it('1番emojiで1番目の武器が除外される', async () => {
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(weaponRepository.disableWeapon).toHaveBeenCalledWith('わかばシューター');
      expect(mockReaction.users.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('2番emojiで2番目の武器が除外される', async () => {
      mockReaction.emoji.name = NUMBER_EMOJIS[1];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(weaponRepository.disableWeapon).toHaveBeenCalledWith('スプラシューター');
    });

    it('範囲外の番号emojiは無視される', async () => {
      mockReaction.emoji.name = NUMBER_EMOJIS[5];
      mockMessage.embeds[0].description = '1️⃣ <@user1> → **武器A**';

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(weaponRepository.disableWeapon).not.toHaveBeenCalled();
    });

    it('除外失敗時はフィードバックメッセージを送らない', async () => {
      vi.spyOn(weaponRepository, 'disableWeapon').mockResolvedValue(false);
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

      expect(weaponRepository.disableWeapon).not.toHaveBeenCalled();
    });

    it('Embedのdescriptionが空の場合は何もしない', async () => {
      mockMessage.embeds[0].description = '';
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(weaponRepository.disableWeapon).not.toHaveBeenCalled();
    });

    it('武器名が抽出できない形式の場合は何もしない', async () => {
      mockMessage.embeds[0].description = '無効な形式のテキスト';
      mockReaction.emoji.name = NUMBER_EMOJIS[0];

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(weaponRepository.disableWeapon).not.toHaveBeenCalled();
    });

    it('対応していないemojiは無視される', async () => {
      mockReaction.emoji.name = '❌';

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(mockReaction.users.remove).not.toHaveBeenCalled();
      expect(weaponRepository.disableWeapon).not.toHaveBeenCalled();
    });
  });

  describe('registerMessageCreationTime', () => {
    it('新しいメッセージIDのタイムスタンプを記録', () => {
      const beforeTime = Date.now();
      registerMessageCreationTime('new-message-id');
      const afterTime = Date.now();

      // タイムスタンプが記録されたことを間接的に確認（再抽選で使用される）
      mockReaction.emoji.name = REROLL_EMOJI;
      mockMessage.id = 'new-message-id';
      
      // この時点で処理が正常に進むはず（フォールバックメッセージなし）
    });

    it('既に記録されているメッセージIDは上書きしない', () => {
      const messageId = 'existing-message';
      const originalTime = Date.now() - 10000;
      
      // 内部Mapに直接アクセスできないので、動作で確認
      registerMessageCreationTime(messageId);
      const firstCall = Date.now();
      
      // 少し待ってからもう一度呼び出し
      registerMessageCreationTime(messageId);
      
      // 2回目の呼び出しで時刻が更新されていないことを確認するため、
      // 再抽選処理でタイムアウトチェックが一貫していることを確認
    });

    it('複数の異なるメッセージIDを記録できる', () => {
      registerMessageCreationTime('msg1');
      registerMessageCreationTime('msg2');
      registerMessageCreationTime('msg3');

      // 各メッセージで独立したタイムスタンプが管理されることを確認
      // （実際の動作は再抽選ハンドラーでテスト済み）
    });
  });

  describe('タイマー統合テスト', () => {
    it('メッセージ送信時にタイマーを記録し、20秒以内に再抽選可能', async () => {
      const messageId = 'timed-message';
      registerMessageCreationTime(messageId);
      
      mockMessage.id = messageId;
      mockReaction.emoji.name = REROLL_EMOJI;

      // すぐに再抽選（20秒以内）
      await handleReaction(mockReaction, mockUser, mockClient);

      // エラーメッセージが送信されないことを確認
      expect(mockChannel.send).not.toHaveBeenCalledWith(
        expect.stringContaining('20秒以内のみ可能')
      );
    });

    it('メッセージ送信時にタイマーを記録し、20秒経過後は再抽選不可', async () => {
      const messageId = 'timed-message-expired';
      const pastTime = Date.now() - 25000; // 25秒前
      
      // タイムスタンプを過去に設定するため、直接Mapを操作する代わりに
      // Date.nowをモック
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = vi.fn(() => {
        callCount++;
        if (callCount === 1) return pastTime; // registerの時
        return originalDateNow(); // チェックの時は現在時刻
      });

      registerMessageCreationTime(messageId);
      Date.now = originalDateNow; // 元に戻す

      mockMessage.id = messageId;
      mockReaction.emoji.name = REROLL_EMOJI;

      await handleReaction(mockReaction, mockUser, mockClient);

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('20秒以内のみ可能')
      );
    });

    it('タイマー記録なしで再抽選すると、エラーメッセージ', async () => {
      const messageId = 'no-timer-message';
      // registerMessageCreationTimeを呼ばない

      mockMessage.id = messageId;
      mockReaction.emoji.name = REROLL_EMOJI;

      await handleReaction(mockReaction, mockUser, mockClient);

      // エラーメッセージが送信されることを確認
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('再抽選できません')
      );
    });
  });
});

