import { describe, it, expect } from 'vitest';

describe('random command', () => {
  it('コマンド名とdescriptionが定義されている', async () => {
    const { default: randomCommand } = await import('../../src/commands/random.js');
    
    expect(randomCommand.name).toBe('random');
    expect(randomCommand.description).toBeTruthy();
  });

  it('executeメソッドが存在する', async () => {
    const { default: randomCommand } = await import('../../src/commands/random.js');
    
    expect(typeof randomCommand.execute).toBe('function');
  });
});
