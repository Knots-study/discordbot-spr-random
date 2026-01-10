import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactionHandler } from '../../../src/events/handlers/ReactionHandler.js';


class TestHandler extends ReactionHandler {
  constructor(shouldHandle = true, processResult = true) {
    super();
    this.shouldHandle = shouldHandle;
    this.processResult = processResult;
    this.processCallCount = 0;
  }

  async canHandle(context) {
    return this.shouldHandle;
  }

  async process(context) {
    this.processCallCount++;
    return this.processResult;
  }
}

describe('ReactionHandler (Chain of Responsibility)', () => {
  describe('基本動作', () => {
    it('canHandleとprocessを実装していない場合はエラー', async () => {
      const handler = new ReactionHandler();

      await expect(handler.canHandle({})).rejects.toThrow('canHandle() must be implemented');
      await expect(handler.process({})).rejects.toThrow('process() must be implemented');
    });
  });

  describe('setNext', () => {
    it('次のハンドラーを設定できる', () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      const result = handler1.setNext(handler2);

      expect(result).toBe(handler2);
      expect(handler1.nextHandler).toBe(handler2);
    });

    it('チェーンを複数繋げられる', () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();
      const handler3 = new TestHandler();

      handler1.setNext(handler2).setNext(handler3);

      expect(handler1.nextHandler).toBe(handler2);
      expect(handler2.nextHandler).toBe(handler3);
      expect(handler3.nextHandler).toBeNull();
    });
  });

  describe('handle', () => {
    it('canHandleがtrueの場合、processを実行', async () => {
      const handler = new TestHandler(true);
      const context = { test: 'data' };

      const result = await handler.handle(context);

      expect(result).toBe(true);
      expect(handler.processCallCount).toBe(1);
    });

    it('canHandleがfalseの場合、processを実行しない', async () => {
      const handler = new TestHandler(false);

      const result = await handler.handle({});

      expect(result).toBe(false);
      expect(handler.processCallCount).toBe(0);
    });

    it('canHandleがfalseで次のハンドラーがある場合、次を実行', async () => {
      const handler1 = new TestHandler(false);
      const handler2 = new TestHandler(true);
      handler1.setNext(handler2);

      const result = await handler1.handle({});

      expect(handler1.processCallCount).toBe(0);
      expect(handler2.processCallCount).toBe(1);
      expect(result).toBe(true);
    });

    it('複数のハンドラーを順に試行', async () => {
      const handler1 = new TestHandler(false);
      const handler2 = new TestHandler(false);
      const handler3 = new TestHandler(true);
      handler1.setNext(handler2).setNext(handler3);

      const result = await handler1.handle({});

      expect(handler1.processCallCount).toBe(0);
      expect(handler2.processCallCount).toBe(0);
      expect(handler3.processCallCount).toBe(1);
      expect(result).toBe(true);
    });

    it('どのハンドラーも処理しない場合はfalse', async () => {
      const handler1 = new TestHandler(false);
      const handler2 = new TestHandler(false);
      handler1.setNext(handler2);

      const result = await handler1.handle({});

      expect(result).toBe(false);
    });

    it('最初のハンドラーで処理された場合、次は実行しない', async () => {
      const handler1 = new TestHandler(true);
      const handler2 = new TestHandler(true);
      handler1.setNext(handler2);

      const result = await handler1.handle({});

      expect(handler1.processCallCount).toBe(1);
      expect(handler2.processCallCount).toBe(0);
      expect(result).toBe(true);
    });
  });

  describe('複雑なチェーン', () => {
    it('5つのハンドラーからなるチェーンで3番目が処理', async () => {
      const handlers = [
        new TestHandler(false),
        new TestHandler(false),
        new TestHandler(true),
        new TestHandler(true),
        new TestHandler(true)
      ];

      handlers[0].setNext(handlers[1])
        .setNext(handlers[2])
        .setNext(handlers[3])
        .setNext(handlers[4]);

      const result = await handlers[0].handle({});

      expect(handlers[0].processCallCount).toBe(0);
      expect(handlers[1].processCallCount).toBe(0);
      expect(handlers[2].processCallCount).toBe(1);
      expect(handlers[3].processCallCount).toBe(0);
      expect(handlers[4].processCallCount).toBe(0);
      expect(result).toBe(true);
    });

    it('コンテキストが各ハンドラーに渡される', async () => {
      const context = { emoji: '🔄', userId: 'user123' };
      const handler1 = new TestHandler(false);
      const handler2 = new TestHandler(true);

      // canHandleでコンテキストを確認できるようモック
      const spy1 = vi.spyOn(handler1, 'canHandle');
      const spy2 = vi.spyOn(handler2, 'canHandle');

      handler1.setNext(handler2);
      await handler1.handle(context);

      expect(spy1).toHaveBeenCalledWith(context);
      expect(spy2).toHaveBeenCalledWith(context);
    });
  });

  describe('エラーハンドリング', () => {
    it('processでエラーが発生しても伝播する', async () => {
      class ErrorHandler extends TestHandler {
        async process() {
          throw new Error('Process error');
        }
      }

      const handler = new ErrorHandler(true);

      await expect(handler.handle({})).rejects.toThrow('Process error');
    });

    it('canHandleでエラーが発生しても伝播する', async () => {
      class ErrorHandler extends TestHandler {
        async canHandle() {
          throw new Error('CanHandle error');
        }
      }

      const handler = new ErrorHandler();

      await expect(handler.handle({})).rejects.toThrow('CanHandle error');
    });
  });
});
