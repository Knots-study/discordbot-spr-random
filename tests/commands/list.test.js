import { describe, it, expect } from 'vitest';

describe('list command', () => {
  it('コマンド名とdescriptionが定義されている', async () => {
    const { default: listCommand } = await import('../../src/commands/list.js');
    
    expect(listCommand.name).toBe('list');
    expect(listCommand.description).toBeTruthy();
  });

  it('executeメソッドが存在する', async () => {
    const { default: listCommand } = await import('../../src/commands/list.js');
    
    expect(typeof listCommand.execute).toBe('function');
  });
});
