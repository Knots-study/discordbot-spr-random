import { describe, it, expect } from 'vitest';

describe('clear command', () => {
  it('コマンド名とdescriptionが定義されている', async () => {
    const { default: clearCommand } = await import('../../src/commands/clear.js');
    
    expect(clearCommand.name).toBe('clear');
    expect(clearCommand.description).toBeTruthy();
  });

  it('executeメソッドが存在する', async () => {
    const { default: clearCommand } = await import('../../src/commands/clear.js');
    
    expect(typeof clearCommand.execute).toBe('function');
  });
});
