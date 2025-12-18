import type { MedusaResponse } from '@medusajs/framework/http';
import { HttpStatusCode } from '@/helpers/http.constants';
import { CookieUtil, type IAuthCookieOptions } from '@/utils/cookie.util';

export interface IStandardResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  errors?: IValidationErrorDetail[];
  stack?: string;
  statusCode?: number;
}

export interface IValidationErrorDetail {
  path: string;
  message: string;
}

export class ResponseFormatter {
  /**
   * Send a successful response with data
   * @internal Used by handleResponse
   */
  static success<T>(
    res: MedusaResponse,
    message: string,
    data: T,
    statusCode: number = HttpStatusCode.OK
  ): MedusaResponse {
    return res.status(statusCode).json({
      status: 'success',
      statusCode,
      message,
      data,
    } as IStandardResponse<T>);
  }

  /**
   * Send a successful response with data and set auth cookie
   * @internal Used by handleResponse
   */
  static successWithAuth<T>(
    res: MedusaResponse,
    message: string,
    data: T & { token: string },
    statusCode: number = HttpStatusCode.OK,
    cookieOptions?: Partial<IAuthCookieOptions>
  ): MedusaResponse {
    // Set authentication cookie
    CookieUtil.setAuthToken(res, data.token, cookieOptions);

    // Return response with token in body for backward compatibility
    return res.status(statusCode).json({
      status: 'success',
      statusCode,
      message,
      data,
    } as IStandardResponse<T & { token: string }>);
  }

  /**
   * Send a successful response without data
   * @internal Used by handleResponse
   */
  static successNoData(
    res: MedusaResponse,
    message: string,
    statusCode: number = HttpStatusCode.OK
  ): MedusaResponse {
    return res.status(statusCode).json({
      status: 'success',
      statusCode,
      message,
    } as IStandardResponse);
  }

  /**
   * Send an error response
   */
  static error(
    res: MedusaResponse,
    message: string,
    statusCode: number = HttpStatusCode.BAD_REQUEST,
    stack?: string
  ): MedusaResponse {
    return res.status(statusCode).json({
      status: 'error',
      statusCode,
      message,
      stack,
    } as IStandardResponse);
  }

  /**
   * Send a validation error response
   */
  static validationError(
    res: MedusaResponse,
    message: string = 'Validation failed',
    statusCode: number = HttpStatusCode.BAD_REQUEST,
    errors?: IValidationErrorDetail[]
  ): MedusaResponse {
    return res.status(HttpStatusCode.BAD_REQUEST).json({
      statusCode,
      status: 'error',
      message,
      errors,
    } as IStandardResponse);
  }

  /**
   * Send an internal server error response
   */
  static internalError(
    res: MedusaResponse,
    message: string = 'Internal server error',
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR
  ): MedusaResponse {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      statusCode,
      status: 'error',
      message,
    } as IStandardResponse);
  }
}

/**
 * Unified generic response handler that can handle all response types
 * This replaces the need for multiple specific handlers
 */
export interface IGenericResponse<T = any> {
  status_code: number;
  message: string;
  data?: T;
  errors?: IValidationErrorDetail[];
  cookieOptions?: Partial<IAuthCookieOptions>;
}

export const handleResponse = <T>(
  res: MedusaResponse,
  result: IGenericResponse<T>
): MedusaResponse => {
  const { status_code, message, data, errors, cookieOptions } = result;

  // Handle validation errors (even with empty errors array)
  if (errors !== undefined)
    return ResponseFormatter.validationError(res, message, status_code, errors);

  // Handle error status codes (4xx, 5xx)
  if (status_code >= HttpStatusCode.BAD_REQUEST)
    return ResponseFormatter.error(res, message, status_code);

  // Handle authentication responses with token in data
  if (data && typeof data === 'object' && 'token' in data) {
    // Clear any existing auth cookies first
    CookieUtil.clearAuthToken(res);

    if (data.token) {
      // Set cookie only when token exists
      return ResponseFormatter.successWithAuth(
        res,
        message,
        data as any,
        status_code,
        cookieOptions
      );
    } else {
      return ResponseFormatter.success(res, message, data, status_code);
    }
  }

  // Handle success responses with or without data
  if (data !== undefined) {
    return ResponseFormatter.success(res, message, data, status_code);
  } else {
    return ResponseFormatter.successNoData(res, message, status_code);
  }
};

export default ResponseFormatter;
