import { describe, it, expect, beforeEach } from 'vitest';
import { createMockMessage } from '../helpers/mockFactory.js';

describe('all command', () => {
  let mockMessage;

  beforeEach(() => {
    mockMessage = createMockMessage();
  });

  it('全武器リストを返す', async () => {
    const { default: allCommand } = await import('../../src/commands/all.js');
    
    await allCommand.execute(mockMessage, []);
    
    expect(mockMessage.reply).toHaveBeenCalled();
  });

  it('コマンド名が定義されている', async () => {
    const { default: allCommand } = await import('../../src/commands/all.js');
    
    expect(allCommand.name).toBe('all');
  });
});
