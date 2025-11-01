import { describe, it, expect, beforeEach } from 'vitest';
import { createMockMessage } from '../helpers/mockFactory.js';

describe('help command', () => {
  let mockMessage;

  beforeEach(() => {
    mockMessage = createMockMessage();
  });

  it('ヘルプメッセージを返す', async () => {
    const { default: helpCommand } = await import('../../src/commands/help.js');
    
    await helpCommand.execute(mockMessage, []);
    
    expect(mockMessage.reply).toHaveBeenCalled();
    const callArg = mockMessage.reply.mock.calls[0][0];
    expect(callArg).toHaveProperty('embeds');
  });

  it('コマンド名が定義されている', async () => {
    const { default: helpCommand } = await import('../../src/commands/help.js');
    
    expect(helpCommand.name).toBe('help');
  });
});
