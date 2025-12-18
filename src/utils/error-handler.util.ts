import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { MedusaError } from '@medusajs/utils';
import { ZodError } from 'zod';
import {
  ResponseFormatter,
  type IValidationErrorDetail,
  handleResponse,
} from '@/utils/response.util';
import { logger } from '@/utils/custom-logger';
import { HttpStatusCode } from '@/helpers/http.constants';
import { envConfig } from '@/helpers/env.helpers';

// Centralized status code mapping for MedusaError types
const medusaErrorStatusMap: Record<string, number> = {
  [MedusaError.Types.INVALID_DATA]: HttpStatusCode.BAD_REQUEST,
  [MedusaError.Types.INVALID_ARGUMENT]: HttpStatusCode.BAD_REQUEST,
  [MedusaError.Types.UNAUTHORIZED]: HttpStatusCode.UNAUTHORIZED,
  [MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR]:
    HttpStatusCode.PAYMENT_REQUIRED,
  [MedusaError.Types.PAYMENT_REQUIRES_MORE_ERROR]:
    HttpStatusCode.PAYMENT_REQUIRED,
  [MedusaError.Types.NOT_ALLOWED]: HttpStatusCode.FORBIDDEN,
  [MedusaError.Types.NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [MedusaError.Types.CONFLICT]: HttpStatusCode.CONFLICT,
  [MedusaError.Types.DUPLICATE_ERROR]: HttpStatusCode.CONFLICT,
  [MedusaError.Types.UNEXPECTED_STATE]: HttpStatusCode.UNPROCESSABLE_ENTITY,
  [MedusaError.Types.DB_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [MedusaError.Types.UNKNOWN_MODULES]: HttpStatusCode.INTERNAL_SERVER_ERROR,
};

export interface IAppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements IAppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true
  ) {
    // Include status code in the message for workflow error extraction
    super(`${message} [STATUS_CODE:${statusCode}]`);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper functions to create MedusaError instances
export const createValidationError = (
  message: string = 'Validation failed'
) => {
  return new MedusaError(MedusaError.Types.INVALID_DATA, message);
};

export const createNotFoundError = (message: string = 'Resource not found') => {
  return new MedusaError(MedusaError.Types.NOT_FOUND, message);
};

export const createUnauthorizedError = (
  message: string = 'Unauthorized access'
) => {
  return new MedusaError(MedusaError.Types.UNAUTHORIZED, message);
};

export const createConflictError = (message: string = 'Resource conflict') => {
  return new MedusaError(MedusaError.Types.CONFLICT, message);
};

export const createForbiddenError = (message: string = 'Forbidden access') => {
  return new MedusaError(MedusaError.Types.NOT_ALLOWED, message);
};

export const createInvalidArgumentError = (
  message: string = 'Invalid argument'
) => {
  return new MedusaError(MedusaError.Types.INVALID_ARGUMENT, message);
};

export const createUnexpectedStateError = (
  message: string = 'Unexpected state'
) => {
  return new MedusaError(MedusaError.Types.UNEXPECTED_STATE, message);
};

export const createDatabaseError = (
  message: string = 'Database operation failed'
) => {
  return new MedusaError(MedusaError.Types.DB_ERROR, message);
};

/**
 * Maps errors to standardized error response format
 * Separates error mapping from response formatting
 */
interface IErrorMapping {
  statusCode: number;
  message: string;
  errors?: IValidationErrorDetail[];
  isOperational: boolean;
}

const mapErrorToResponse = (error: Error | IAppError): IErrorMapping => {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    return {
      statusCode: HttpStatusCode.BAD_REQUEST,
      message: 'Validation failed',
      errors: validationErrors,
      isOperational: true,
    };
  }

  // Handle MedusaError instances
  if (MedusaError.isMedusaError(error)) {
    const medusaError = error as MedusaError;
    const statusCode =
      medusaErrorStatusMap[medusaError.type] ??
      HttpStatusCode.INTERNAL_SERVER_ERROR;
    const isOperational = statusCode < 500; // 4xx errors are operational, 5xx are not

    // Don't expose internal error details in production for server errors
    const safeMessage =
      envConfig.NODE_ENV === 'production' &&
      statusCode >= HttpStatusCode.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : medusaError.message;

    return {
      statusCode,
      message: safeMessage,
      isOperational,
    };
  }

  // Handle custom application errors
  if (error instanceof CustomError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      isOperational: error.isOperational,
    };
  }

  // Handle workflow errors that might wrap CustomError
  // Check if the error has a cause or inner error that might be a CustomError
  if ((error as any).cause && (error as any).cause instanceof CustomError) {
    return {
      statusCode: (error as any).cause.statusCode,
      message: (error as any).cause.message,
      isOperational: (error as any).cause.isOperational,
    };
  }

  // Check if this is a workflow error that contains CustomError information
  if (error.message?.includes('[STATUS_CODE:')) {
    const statusCodeMatch = error.message.match(/\[STATUS_CODE:(\d+)\]/);
    if (statusCodeMatch) {
      const statusCode = parseInt(statusCodeMatch[1], 10);
      const message = error.message.replace(/\s*\[STATUS_CODE:\d+\]/, '');
      return {
        statusCode,
        message,
        isOperational: statusCode < 500,
      };
    }
  }

  // Handle database errors
  if (
    error.name === 'QueryFailedError' ||
    error.name === 'EntityNotFoundError'
  ) {
    const safeMessage =
      envConfig.NODE_ENV === 'production'
        ? 'Database operation failed'
        : error.message;
    return {
      statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: safeMessage,
      isOperational: false,
    };
  }

  // Handle JWT errors
  if (
    error.name === 'JsonWebTokenError' ||
    error.name === 'TokenExpiredError'
  ) {
    return {
      statusCode: HttpStatusCode.UNAUTHORIZED,
      message: 'Invalid or expired token',
      isOperational: true,
    };
  }

  // Handle default errors
  return {
    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    message:
      envConfig.NODE_ENV === 'production'
        ? 'Something went wrong'
        : error.message,
    isOperational: false,
  };
};

/**
 * Global error handler middleware with fail-safe protection
 */
export const globalErrorHandler = (
  error: Error | IAppError,
  req: MedusaRequest,
  res: MedusaResponse,
  _next: () => void
): void => {
  try {
    // Map error to standardized response format
    const errorMapping = mapErrorToResponse(error);

    // Log error with appropriate level based on operational status
    if (errorMapping.isOperational) {
      // Operational errors (validation, auth, not found) - log minimally
      logger.warn(
        `Operational error: ${errorMapping.message} - ${req.method} ${req.url} (${errorMapping.statusCode})`
      );
    } else {
      // Non-operational errors (bugs, system errors) - log with stack trace
      logger.error(`Non-operational error: ${errorMapping.message}`, error);
    }

    // Format and send response based on error type
    if (errorMapping.errors) {
      // Validation errors with detailed field errors
      ResponseFormatter.validationError(
        res,
        errorMapping.message,
        errorMapping.statusCode,
        errorMapping.errors
      );
    } else {
      // Standard error response
      ResponseFormatter.error(
        res,
        errorMapping.message,
        errorMapping.statusCode,
        error.stack
      );
    }
  } catch (handlerError) {
    // Fail-safe: if the error handler itself throws, log and send generic response
    logger.error('Error handler failed', handlerError as Error);

    // Send generic error response
    ResponseFormatter.internalError(res, 'An unexpected error occurred');
  }
};

/**
 * Decorator-like function that automatically handles errors and responses
 * Similar to NestJS where you just return data and errors are handled automatically
 */
export const ControllerMethod = <T extends any[]>(
  fn: (
    req: MedusaRequest,
    res: MedusaResponse,
    next: (error?: any) => void,
    ...args: T
  ) => Promise<{ status_code: number; message: string; data?: any }>
) => {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: (error?: any) => void,
    ...args: T
  ) => {
    try {
      const result = await fn(req, res, next, ...args);
      if (!result)
        // Handle case where controller returns undefined
        return ResponseFormatter.internalError(
          res,
          'An unexpected error occurred'
        );

      return handleResponse(res, result);
    } catch (error) {
      // Handle error directly
      return globalErrorHandler(error as Error, req, res, next);
    }
  };
};

export default globalErrorHandler;
