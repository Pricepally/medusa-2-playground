import {
  runWithContext,
  getContext,
  patchContext,
} from '@/utils/middlewares/async-context';

describe('Async Context', () => {
  beforeEach(() => {
    // Clear any existing context
    jest.clearAllMocks();
  });

  describe('runWithContext', () => {
    it('should run function with provided context', () => {
      // Arrange
      const testContext = { requestId: 'req-123', userId: 'user-456' };
      const testFn = jest.fn(() => 'test result');

      // Act
      const result = runWithContext(testContext, testFn);

      // Assert
      expect(result).toBe('test result');
      expect(testFn).toHaveBeenCalledTimes(1);
    });

    it('should make context available within the function', () => {
      // Arrange
      const testContext = { requestId: 'req-123', userId: 'user-456' };
      let capturedContext: any;

      // Act
      runWithContext(testContext, () => {
        capturedContext = getContext();
      });

      // Assert
      expect(capturedContext).toEqual(testContext);
    });

    it('should handle nested contexts', () => {
      // Arrange
      const outerContext = { requestId: 'req-123', userId: 'user-456' };
      const innerContext = { requestId: 'req-456', sessionId: 'session-789' };
      let outerCaptured: any;
      let innerCaptured: any;

      // Act
      runWithContext(outerContext, () => {
        outerCaptured = getContext();

        runWithContext(innerContext, () => {
          innerCaptured = getContext();
        });
      });

      // Assert
      expect(outerCaptured).toEqual(outerContext);
      expect(innerCaptured).toEqual(innerContext);
    });

    it('should return function result', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };
      const testResult = { data: 'test data' };

      // Act
      const result = runWithContext(testContext, () => testResult);

      // Assert
      expect(result).toEqual(testResult);
    });

    it('should handle function that throws', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };
      const error = new Error('Test error');

      // Act & Assert
      expect(() => {
        runWithContext(testContext, () => {
          throw error;
        });
      }).toThrow('Test error');
    });

    it('should handle async functions', async () => {
      // Arrange
      const testContext = { requestId: 'req-123' };
      const testResult = 'async result';

      // Act
      const result = await runWithContext(testContext, async () => {
        return testResult;
      });

      // Assert
      expect(result).toBe(testResult);
    });

    it('should handle async functions with context access', async () => {
      // Arrange
      const testContext = { requestId: 'req-123', userId: 'user-456' };
      let capturedContext: any;

      // Act
      await runWithContext(testContext, async () => {
        capturedContext = getContext();
        return 'async result';
      });

      // Assert
      expect(capturedContext).toEqual(testContext);
    });
  });

  describe('getContext', () => {
    it('should return empty object when no context is set', () => {
      // Arrange, Act and Assert
      const context = getContext();
      expect(context).toEqual({});
    });

    it('should return current context when set', () => {
      // Arrange
      const testContext = { requestId: 'req-123', userId: 'user-456' };

      // Act
      runWithContext(testContext, () => {
        const context = getContext();

        // Assert
        expect(context).toEqual(testContext);
      });
    });

    it('should return updated context after patching', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };

      // Act
      runWithContext(testContext, () => {
        patchContext({ userId: 'user-456' });
        const context = getContext();

        // Assert
        expect(context).toEqual({
          requestId: 'req-123',
          userId: 'user-456',
        });
      });
    });

    it('should return different contexts in different scopes', () => {
      // Arrange
      const context1 = { requestId: 'req-123' };
      const context2 = { requestId: 'req-456' };
      let captured1: any;
      let captured2: any;

      // Act
      runWithContext(context1, () => {
        captured1 = getContext();
      });

      runWithContext(context2, () => {
        captured2 = getContext();
      });

      // Assert
      expect(captured1).toEqual(context1);
      expect(captured2).toEqual(context2);
      expect(captured1).not.toEqual(captured2);
    });
  });

  describe('patchContext', () => {
    it('should update existing context with new values', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };

      // Act
      runWithContext(testContext, () => {
        patchContext({ userId: 'user-456' });
        const context = getContext();

        // Assert
        expect(context).toEqual({
          requestId: 'req-123',
          userId: 'user-456',
        });
      });
    });

    it('should overwrite existing values', () => {
      // Arrange
      const testContext = { requestId: 'req-123', userId: 'user-456' };

      // Act
      runWithContext(testContext, () => {
        patchContext({ userId: 'user-789' });
        const context = getContext();

        // Assert
        expect(context).toEqual({
          requestId: 'req-123',
          userId: 'user-789',
        });
      });
    });

    it('should add new values to context', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };

      // Act
      runWithContext(testContext, () => {
        patchContext({ userId: 'user-456', sessionId: 'session-789' });
        const context = getContext();

        // Assert
        expect(context).toEqual({
          requestId: 'req-123',
          userId: 'user-456',
          sessionId: 'session-789',
        });
      });
    });

    it('should handle multiple patches', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };

      // Act
      runWithContext(testContext, () => {
        patchContext({ userId: 'user-456' });
        patchContext({ sessionId: 'session-789' });
        patchContext({ timestamp: Date.now() });

        const context = getContext();

        // Assert
        expect(context).toEqual({
          requestId: 'req-123',
          userId: 'user-456',
          sessionId: 'session-789',
          timestamp: expect.any(Number),
        });
      });
    });

    it('should handle empty patch object', () => {
      // Arrange
      const testContext = { requestId: 'req-123', userId: 'user-456' };

      // Act
      runWithContext(testContext, () => {
        patchContext({});
        const context = getContext();

        // Assert
        expect(context).toEqual(testContext);
      });
    });

    it('should handle null and undefined values', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };

      // Act
      runWithContext(testContext, () => {
        patchContext({ userId: null, sessionId: undefined });
        const context = getContext();

        // Assert
        expect(context).toEqual({
          requestId: 'req-123',
          userId: null,
          sessionId: undefined,
        });
      });
    });

    it('should not affect context when no context is set', () => {
      // Arrange
      // Act
      patchContext({ userId: 'user-456' });
      const context = getContext();

      // Assert
      expect(context).toEqual({});
    });

    it('should handle nested object updates', () => {
      // Arrange
      const testContext = {
        requestId: 'req-123',
        metadata: {
          source: 'api',
          version: '1.0',
        },
      };

      // Act
      runWithContext(testContext, () => {
        patchContext({
          metadata: {
            ...testContext.metadata,
            timestamp: Date.now(),
          },
        });
        const context = getContext();

        // Assert
        expect(context.metadata).toEqual({
          source: 'api',
          version: '1.0',
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe('Context isolation', () => {
    it('should isolate contexts between different runs', () => {
      // Arrange
      const context1 = { requestId: 'req-123' };
      const context2 = { requestId: 'req-456' };
      let captured1: any;
      let captured2: any;

      // Act
      runWithContext(context1, () => {
        captured1 = getContext();
        patchContext({ userId: 'user-123' });
      });

      runWithContext(context2, () => {
        captured2 = getContext();
        patchContext({ userId: 'user-456' });
      });

      // Assert
      expect(captured1).toEqual(context1);
      expect(captured2).toEqual(context2);
    });

    it('should not leak context between different runs', () => {
      // Arrange
      const context1 = { requestId: 'req-123' };
      const context2 = { requestId: 'req-456' };

      // Act
      runWithContext(context1, () => {
        patchContext({ userId: 'user-123' });
      });

      runWithContext(context2, () => {
        const context = getContext();

        // Assert
        expect(context).toEqual(context2);
        expect(context.userId).toBeUndefined();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle complex nested objects', () => {
      const complexContext = {
        requestId: 'req-123',
        user: {
          id: 'user-456',
          profile: {
            name: 'John Doe',
            preferences: {
              theme: 'dark',
              language: 'en',
            },
          },
        },
        metadata: {
          source: 'api',
          timestamp: Date.now(),
        },
      };

      runWithContext(complexContext, () => {
        const context = getContext();
        expect(context).toEqual(complexContext);
      });
    });

    it('should handle functions that modify context', () => {
      // Arrange
      const testContext = { requestId: 'req-123' };

      // Act
      runWithContext(testContext, () => {
        const modifyContext = () => {
          patchContext({ userId: 'user-456' });
        };

        modifyContext();
        const context = getContext();

        // Assert
        expect(context).toEqual({
          requestId: 'req-123',
          userId: 'user-456',
        });
      });
    });

    it('should handle circular references gracefully', () => {
      // Arrange
      const testContext: any = { requestId: 'req-123' };
      testContext.self = testContext; // Create circular reference

      // Act
      runWithContext(testContext, () => {
        const context = getContext();

        // Assert
        expect(context.requestId).toBe('req-123');
        expect(context.self).toBeDefined();
      });
    });
  });
});
