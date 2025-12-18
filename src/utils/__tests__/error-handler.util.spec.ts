import { MedusaError } from '@medusajs/utils';
import { ZodError } from 'zod';
import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { HttpStatusCode } from '@/helpers/http.constants';
import {
  globalErrorHandler,
  CustomError,
  ControllerMethod,
} from '@/utils/error-handler.util';

// Mock dependencies
jest.mock('../custom-logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock MedusaResponse
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as MedusaResponse;
  return res;
};

// Mock MedusaRequest
const createMockRequest = () => {
  return {
    url: '/test',
    method: 'POST',
    headers: {},
  } as unknown as MedusaRequest;
};

describe('CustomError', () => {
  it('should create custom error with default values', () => {
    // Arrange
    const message = 'Test error';

    // Act
    const error = new CustomError(message);

    // Assert
    expect(error.message).toBe(
      `${message} [STATUS_CODE:${HttpStatusCode.INTERNAL_SERVER_ERROR}]`
    );
    expect(error.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('Error'); // CustomError extends Error, so name is 'Error'
  });

  it('should create custom error with custom status code', () => {
    // Arrange
    const message = 'Not found error';
    const statusCode = HttpStatusCode.NOT_FOUND;

    // Act
    const error = new CustomError(message, statusCode);

    // Assert
    expect(error.message).toBe(`${message} [STATUS_CODE:${statusCode}]`);
    expect(error.statusCode).toBe(statusCode);
    expect(error.isOperational).toBe(true);
  });

  it('should create custom error with non-operational flag', () => {
    // Arrange
    const message = 'System error';
    const statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
    const isOperational = false;

    // Act
    const error = new CustomError(message, statusCode, isOperational);

    // Assert
    expect(error.message).toBe(`${message} [STATUS_CODE:${statusCode}]`);
    expect(error.statusCode).toBe(statusCode);
    expect(error.isOperational).toBe(false);
  });
});

describe('globalErrorHandler', () => {
  let mockReq: MedusaRequest;
  let mockRes: MedusaResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('CustomError handling', () => {
    it('should handle CustomError with status code', () => {
      // Arrange
      const error = new CustomError(
        'Custom error message',
        HttpStatusCode.BAD_REQUEST
      );

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.BAD_REQUEST,
        message: 'Custom error message [STATUS_CODE:400]',
        stack: expect.any(String),
      });
    });

    it('should handle CustomError with default status code', () => {
      // Arrange
      const error = new CustomError('Custom error message');

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Custom error message [STATUS_CODE:500]',
        stack: expect.any(String),
      });
    });
  });

  describe('MedusaError handling', () => {
    it('should handle MedusaError with known type', () => {
      // Arrange
      const error = new MedusaError(
        MedusaError.Types.NOT_FOUND,
        'Resource not found'
      );

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.NOT_FOUND,
        message: 'Resource not found',
        stack: expect.any(String),
      });
    });

    it('should handle MedusaError with unknown type', () => {
      // Arrange
      const error = new MedusaError('UNKNOWN_TYPE', 'Unknown error');

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Unknown error',
        stack: expect.any(String),
      });
    });
  });

  describe('ZodError handling', () => {
    it('should handle ZodError with validation errors', () => {
      // Arrange
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        } as any,
        {
          code: 'too_small',
          minimum: 6,
          type: 'string',
          inclusive: true,
          path: ['password'],
          message: 'String must contain at least 6 character(s)',
        },
      ]);

      // Act
      globalErrorHandler(zodError, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          { path: 'email', message: 'Expected string, received number' },
          {
            path: 'password',
            message: 'String must contain at least 6 character(s)',
          },
        ],
      });
    });

    it('should handle ZodError with empty issues', () => {
      // Arrange
      const zodError = new ZodError([]);

      // Act
      globalErrorHandler(zodError, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.BAD_REQUEST,
        message: 'Validation failed',
        errors: [],
      });
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic Error', () => {
      // Arrange
      const error = new Error('Generic error message');

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Generic error message',
        stack: expect.any(String),
      });
    });

    it('should handle error without message', () => {
      // Arrange
      const error = new Error();

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: '',
        stack: expect.any(String),
      });
    });

    it('should handle non-Error object', () => {
      // Arrange
      const error = 'String error' as any;

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: undefined,
        stack: undefined,
      });
    });
  });

  describe('Error logging', () => {
    it('should log operational errors as warnings', () => {
      // Arrange
      const { logger } = require('../custom-logger');
      const error = new CustomError(
        'Operational error',
        HttpStatusCode.BAD_REQUEST,
        true
      );

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Operational error: Custom error message [STATUS_CODE:400] - POST /test (400)'
        )
      );
    });

    it('should log non-operational errors as errors', () => {
      // Arrange
      const { logger } = require('../custom-logger');
      const error = new CustomError(
        'System error',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        false
      );

      // Act
      globalErrorHandler(error, mockReq, mockRes, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Non-operational error: System error [STATUS_CODE:500]'
        ),
        expect.any(Error)
      );
    });
  });
});

describe('ControllerMethod', () => {
  let mockReq: MedusaRequest;
  let mockRes: MedusaResponse;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  it('should execute controller function successfully', async () => {
    // Arrange
    const mockController = jest.fn().mockResolvedValue({
      status_code: HttpStatusCode.OK,
      message: 'Success',
      data: { id: 1 },
    });
    const wrappedController = ControllerMethod(mockController);

    // Act
    await wrappedController(mockReq, mockRes, mockNext);

    // Assert
    expect(mockController).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'success',
      statusCode: HttpStatusCode.OK,
      message: 'Success',
      data: { id: 1 },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle controller function errors', async () => {
    // Arrange
    const error = new CustomError(
      'Controller error',
      HttpStatusCode.BAD_REQUEST
    );
    const mockController = jest.fn().mockRejectedValue(error);
    const wrappedController = ControllerMethod(mockController);

    // Act
    await wrappedController(mockReq, mockRes, mockNext);

    // Assert
    expect(mockController).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: 'Controller error [STATUS_CODE:400]',
      stack: expect.any(String),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass additional arguments to controller function', async () => {
    // Arrange
    const mockController = jest.fn().mockResolvedValue({
      status_code: HttpStatusCode.OK,
      message: 'Success',
    });
    const wrappedController = ControllerMethod(mockController);
    const additionalArgs = ['arg1', 'arg2'];

    // Act
    await wrappedController(mockReq, mockRes, mockNext, ...additionalArgs);

    // Assert
    expect(mockController).toHaveBeenCalledWith(
      mockReq,
      mockRes,
      mockNext,
      ...additionalArgs
    );
  });

  it('should handle controller function with no return value', async () => {
    // Arrange
    const mockController = jest.fn().mockResolvedValue(undefined);
    const wrappedController = ControllerMethod(mockController);

    // Act
    await wrappedController(mockReq, mockRes, mockNext);

    // Assert
    expect(mockController).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    // Should call response methods with default error when no return value
    expect(mockRes.status).toHaveBeenCalledWith(
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    });
  });
});
