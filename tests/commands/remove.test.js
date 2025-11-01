import { describe, it, expect, beforeEach } from 'vitest';
import { createMockMessage } from '../helpers/mockFactory.js';

describe('remove command', () => {
  let mockMessage;

  beforeEach(() => {
    mockMessage = createMockMessage();
  });

  it('武器名が指定されていない場合はエラーメッセージを返す', async () => {
    const { default: removeCommand } = await import('../../src/commands/remove.js');
    
    await removeCommand.execute(mockMessage, []);
    
    expect(mockMessage.reply).toHaveBeenCalledWith(
      expect.stringContaining('❌ 除外する武器名または武器種別を指定してください')
    );
  });

  it('コマンド名とdescriptionが定義されている', async () => {
    const { default: removeCommand } = await import('../../src/commands/remove.js');
    
    expect(removeCommand.name).toBe('remove');
    expect(removeCommand.description).toBeTruthy();
  });
});
