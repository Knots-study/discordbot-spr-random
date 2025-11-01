import { describe, it, expect, beforeEach } from 'vitest';
import { createMockMessage } from '../helpers/mockFactory.js';

describe('add command', () => {
  let mockMessage;

  beforeEach(() => {
    mockMessage = createMockMessage();
  });

  it('武器名が指定されていない場合はエラーメッセージを返す', async () => {
    const { default: addCommand } = await import('../../src/commands/add.js');
    
    await addCommand.execute(mockMessage, []);
    
    expect(mockMessage.reply).toHaveBeenCalledWith(
      expect.stringContaining('❌ 追加する武器名または武器種別を指定してください')
    );
  });

  it('コマンド名とdescriptionが定義されている', async () => {
    const { default: addCommand } = await import('../../src/commands/add.js');
    
    expect(addCommand.name).toBe('add');
    expect(addCommand.description).toBeTruthy();
  });
});
