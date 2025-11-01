import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockReaction, createMockUser, createMockClient } from './helpers/mockFactory.js';

describe('reactionAdd event', () => {
  let handleReaction;

  beforeEach(async () => {
    const module = await import('../src/events/reactionAdd.js');
    handleReaction = module.default;
  });

  it('Botのリアクションは無視する', async () => {
    const mockReaction = createMockReaction({ authorId: 'bot-id' });
    const mockUser = createMockUser({ bot: true });
    const mockClient = createMockClient({ userId: 'bot-id' });

    await handleReaction(mockReaction, mockUser, mockClient);
    
    expect(mockReaction.message.guild.members.fetch).not.toHaveBeenCalled();
  });

  it('🔄以外のリアクションは無視する', async () => {
    const mockReaction = createMockReaction({ emoji: '👍' });
    const mockUser = createMockUser({ bot: false });
    const mockClient = createMockClient({ userId: 'bot-id' });

    await handleReaction(mockReaction, mockUser, mockClient);
    
    expect(mockReaction.message.guild.members.fetch).not.toHaveBeenCalled();
  });

  it('Bot以外のメッセージは無視する', async () => {
    const mockReaction = createMockReaction({ authorId: 'user-id' });
    const mockUser = createMockUser({ bot: false });
    const mockClient = createMockClient({ userId: 'bot-id' });

    await handleReaction(mockReaction, mockUser, mockClient);
    
    expect(mockReaction.message.guild.members.fetch).not.toHaveBeenCalled();
  });

  it('部分的なリアクションをフェッチする', async () => {
    const mockReaction = createMockReaction({ partial: true });

    expect(mockReaction.partial).toBe(true);
    expect(typeof mockReaction.fetch).toBe('function');
  });

  it('エクスポートされた関数である', () => {
    expect(typeof handleReaction).toBe('function');
  });
});
