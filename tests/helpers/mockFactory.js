import { vi } from 'vitest';

/**
 * モックメッセージを作成
 */
export function createMockMessage() {
  return {
    reply: vi.fn(),
    member: { voice: { channel: null } },
    guild: { members: { fetch: vi.fn() } },
  };
}

/**
 * モックメンバーMapを作成（filter付き）
 */
export function createMockMembers(members) {
  const mockMap = new Map(members);
  
  mockMap.filter = function(callback) {
    const filtered = new Map();
    for (const [key, value] of this.entries()) {
      if (callback(value)) {
        filtered.set(key, value);
      }
    }
    return filtered;
  };
  
  return mockMap;
}

/**
 * モックリアクションを作成
 */
export function createMockReaction({ partial = false, emoji = '🔄', authorId = 'bot-id' }) {
  return {
    partial,
    emoji: { name: emoji },
    message: {
      author: { id: authorId },
      guild: { members: { fetch: vi.fn() } },
      embeds: [],
    },
    fetch: vi.fn(),
    remove: vi.fn(),
    users: { remove: vi.fn() },
  };
}

/**
 * モックユーザーを作成
 */
export function createMockUser({ bot = false, id = 'user-id' }) {
  return { bot, id };
}

/**
 * モッククライアントを作成
 */
export function createMockClient({ userId = 'bot-id' }) {
  return { user: { id: userId } };
}
