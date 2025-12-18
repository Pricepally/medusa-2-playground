// Mock dependencies before importing the logger
jest.mock('pino', () => {
  const mockPinoInstance = {
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    level: 'info',
  };

  const mockPino = jest.fn(() => mockPinoInstance);
  (mockPino as any).stdTimeFunctions = {
    isoTime: jest.fn(),
  };
  return mockPino;
});

jest.mock('../middlewares/async-context', () => ({
  getContext: jest.fn(() => ({ requestId: 'test-123' })),
}));

jest.mock('@/helpers/env.helpers', () => ({
  envConfig: {
    LOG_LEVEL: 'info',
  },
}));

import { logger } from '@/utils/custom-logger';
import { getContext } from '@/utils/middlewares/async-context';

describe('Custom Logger', () => {
  let mockPinoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked pino instance
    const pino = require('pino');
    mockPinoInstance = pino();
  });

  describe('Logger Initialization', () => {
    it('should be properly initialized', () => {
      // Arrange, Act and Assert
      expect(logger).toBeDefined();
      expect(typeof logger.panic).toBe('function');
      expect(typeof logger.shouldLog).toBe('function');
    });
  });

  describe('panic method', () => {
    it('should call pino fatal with correct parameters', () => {
      // Arrange
      const testData = { error: 'test error' };

      // Act
      logger.panic(testData);

      // Assert
      expect(mockPinoInstance.fatal).toHaveBeenCalledWith(
        { data: testData },
        'PANIC'
      );
    });
  });

  describe('shouldLog method', () => {
    it('should return true for levels at or below current level', () => {
      // Arrange
      mockPinoInstance.level = 'info';

      // Act & Assert
      expect(logger.shouldLog('fatal')).toBe(true);
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(true);
    });

    it('should return false for levels above current level', () => {
      // Arrange
      mockPinoInstance.level = 'info';

      // Act & Assert
      expect(logger.shouldLog('debug')).toBe(false);
      expect(logger.shouldLog('trace')).toBe(false);
    });

    it('should handle different log levels correctly', () => {
      // Arrange
      mockPinoInstance.level = 'warn';

      // Act & Assert
      expect(logger.shouldLog('fatal')).toBe(true);
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(false);
      expect(logger.shouldLog('debug')).toBe(false);
    });
  });

  describe('setLogLevel method', () => {
    it('should set pino level and log the change', () => {
      // Arrange and Act
      logger.setLogLevel('debug');

      // Assert
      expect(mockPinoInstance.level).toBe('debug');
      expect(mockPinoInstance.info).toHaveBeenCalledWith({
        msg: 'Set log level: debug',
      });
    });
  });

  describe('unsetLogLevel method', () => {
    it('should reset pino level to info and log the change', () => {
      // Arrange and Act
      logger.unsetLogLevel();

      // Assert
      expect(mockPinoInstance.level).toBe('info');
      expect(mockPinoInstance.info).toHaveBeenCalledWith({
        msg: 'Unset log level',
      });
    });
  });

  describe('Activity methods', () => {
    describe('activity method', () => {
      it('should generate activity ID and log activity message', () => {
        // Arrange
        const message = 'Test activity';

        // Act
        const activityId = logger.activity(message);

        // Assert
        expect(typeof activityId).toBe('string');
        expect(activityId.length).toBeGreaterThan(0);
        expect(mockPinoInstance.info).toHaveBeenCalledWith({
          activityId,
          msg: `ACTIVITY: ${message}`,
        });
      });

      it('should generate unique activity IDs', () => {
        // Arrange and Act
        const id1 = logger.activity('Activity 1');
        const id2 = logger.activity('Activity 2');

        // Assert
        expect(id1).not.toBe(id2);
      });
    });

    describe('progress method', () => {
      it('should log progress message with activity ID', () => {
        // Arrange
        const activityId = 'test-activity-123';
        const message = 'Processing...';

        // Act
        logger.progress(activityId, message);

        // Assert
        expect(mockPinoInstance.info).toHaveBeenCalledWith({
          activityId,
          msg: `PROGRESS: ${message}`,
        });
      });
    });

    describe('failure method', () => {
      it('should log failure message and return null', () => {
        // Arrange
        const activityId = 'test-activity-123';
        const message = 'Operation failed';

        // Act
        const result = logger.failure(activityId, message);

        // Assert
        expect(result).toBeNull();
        expect(mockPinoInstance.warn).toHaveBeenCalledWith({
          activityId,
          msg: `FAILURE: ${message}`,
        });
      });
    });

    describe('success method', () => {
      it('should log success message and return activity data', () => {
        // Arrange
        const activityId = 'test-activity-123';
        const message = 'Operation completed';

        // Act
        const result = logger.success(activityId, message);

        // Assert
        expect(result).toEqual({
          activityId,
          message,
        });
        expect(mockPinoInstance.info).toHaveBeenCalledWith({
          activityId,
          msg: `SUCCESS: ${message}`,
        });
      });
    });
  });

  describe('Error logging', () => {
    describe('error method', () => {
      it('should handle Error object as first parameter', () => {
        // Arrange
        const error = new Error('Test error');

        // Act
        logger.error(error);

        // Assert
        expect(mockPinoInstance.error).toHaveBeenCalledWith(
          { err: error },
          error.message
        );
      });

      it('should handle string message with Error object as second parameter', () => {
        // Arrange
        const message = 'Something went wrong';
        const error = new Error('Underlying error');

        // Act
        logger.error(message, error);

        // Assert
        expect(mockPinoInstance.error).toHaveBeenCalledWith(
          { err: error },
          message
        );
      });

      it('should handle string message only', () => {
        // Arrange
        const message = 'Simple error message';

        // Act
        logger.error(message);

        // Assert
        expect(mockPinoInstance.error).toHaveBeenCalledWith({
          msg: message,
        });
      });
    });
  });

  describe('Log level methods', () => {
    describe('silly method', () => {
      it('should call pino debug', () => {
        // Arrange
        const message = 'Silly message';

        // Act
        logger.silly(message);

        // Assert
        expect(mockPinoInstance.debug).toHaveBeenCalledWith({
          msg: message,
        });
      });
    });

    describe('debug method', () => {
      it('should call pino debug', () => {
        // Arrange
        const message = 'Debug message';

        // Act
        logger.debug(message);

        // Assert
        expect(mockPinoInstance.debug).toHaveBeenCalledWith({
          msg: message,
        });
      });
    });

    describe('verbose method', () => {
      it('should call pino info', () => {
        // Arrange
        const message = 'Verbose message';

        // Act
        logger.verbose(message);

        // Assert
        expect(mockPinoInstance.info).toHaveBeenCalledWith({
          msg: message,
        });
      });
    });

    describe('http method', () => {
      it('should call pino info with HTTP prefix', () => {
        // Arrange
        const message = 'Request received';

        // Act
        logger.http(message);

        // Assert
        expect(mockPinoInstance.info).toHaveBeenCalledWith({
          msg: `HTTP: ${message}`,
        });
      });
    });

    describe('info method', () => {
      it('should call pino info', () => {
        // Arrange
        const message = 'Info message';

        // Act
        logger.info(message);

        // Assert
        expect(mockPinoInstance.info).toHaveBeenCalledWith({
          msg: message,
        });
      });
    });

    describe('warn method', () => {
      it('should call pino warn', () => {
        // Arrange
        const message = 'Warning message';

        // Act
        logger.warn(message);

        // Assert
        expect(mockPinoInstance.warn).toHaveBeenCalledWith({
          msg: message,
        });
      });
    });

    describe('log method', () => {
      it('should call pino info with args', () => {
        const args = ['arg1', 'arg2', { data: 'test' }];
        logger.log(...args);

        // Assert
        expect(mockPinoInstance.info).toHaveBeenCalledWith({
          args,
        });
      });
    });
  });

  describe('Context integration', () => {
    it('should use context from async-context', () => {
      // Arrange
      const mockContext = { requestId: 'req-123', userId: 'user-456' };
      (getContext as jest.Mock).mockReturnValue(mockContext);

      // Act
      const context = getContext();

      // Assert
      expect(getContext).toHaveBeenCalled();
      expect(context).toEqual(mockContext);
    });
  });

  describe('Logger instance export', () => {
    it('should export logger instance', () => {
      // Arrange, Act and Assert
      expect(logger).toBeDefined();
      expect(typeof logger.panic).toBe('function');
      expect(typeof logger.shouldLog).toBe('function');
      expect(typeof logger.setLogLevel).toBe('function');
      expect(typeof logger.unsetLogLevel).toBe('function');
      expect(typeof logger.activity).toBe('function');
      expect(typeof logger.progress).toBe('function');
      expect(typeof logger.failure).toBe('function');
      expect(typeof logger.success).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.silly).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.verbose).toBe('function');
      expect(typeof logger.http).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.log).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string messages', () => {
      // Arrange and Act
      logger.info('');

      // Assert
      expect(mockPinoInstance.info).toHaveBeenCalledWith({
        msg: '',
      });
    });

    it('should handle null and undefined in log method', () => {
      // Arrange and Act
      logger.log(null, undefined, 'test');

      // Assert
      expect(mockPinoInstance.info).toHaveBeenCalledWith({
        args: [null, undefined, 'test'],
      });
    });

    it('should handle complex objects in log method', () => {
      // Arrange
      const complexObj = { nested: { data: [1, 2, 3] } };

      // Act
      logger.log(complexObj);

      // Assert
      expect(mockPinoInstance.info).toHaveBeenCalledWith({
        args: [complexObj],
      });
    });
  });
});
