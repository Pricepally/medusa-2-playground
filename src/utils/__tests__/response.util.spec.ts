import { MedusaResponse } from '@medusajs/framework/http';
import {
  ResponseFormatter,
  handleResponse,
  type IGenericResponse,
} from '@/utils/response.util';
import { HttpStatusCode } from '@/helpers/http.constants';

// Mock CookieUtil
jest.mock('../cookie.util', () => ({
  CookieUtil: {
    clearAuthToken: jest.fn(),
    setAuthToken: jest.fn(),
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

describe('ResponseFormatter', () => {
  let mockRes: MedusaResponse;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('success', () => {
    it('should send successful response with data', () => {
      // Arrange
      const message = 'Success message';
      const data = { id: 1, name: 'Test' };
      const statusCode = HttpStatusCode.OK;

      // Act
      const result = ResponseFormatter.success(
        mockRes,
        message,
        data,
        statusCode
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode,
        message,
        data,
      });
      expect(result).toBe(mockRes);
    });

    it('should use default status code when not provided', () => {
      // Arrange
      const message = 'Success message';
      const data = { id: 1 };

      // Act
      ResponseFormatter.success(mockRes, message, data);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
    });
  });

  describe('successNoData', () => {
    it('should send successful response without data', () => {
      // Arrange
      const message = 'Success message';
      const statusCode = HttpStatusCode.CREATED;

      // Act
      const result = ResponseFormatter.successNoData(
        mockRes,
        message,
        statusCode
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode,
        message,
      });
      expect(result).toBe(mockRes);
    });
  });

  describe('successWithAuth', () => {
    it('should send successful response with auth token', () => {
      // Arrange
      const message = 'Login successful';
      const data = { token: 'jwt-token', user: { id: 1 } };
      const statusCode = HttpStatusCode.OK;
      const cookieOptions = { maxAge: 3600 };

      // Act
      const result = ResponseFormatter.successWithAuth(
        mockRes,
        message,
        data,
        statusCode,
        cookieOptions
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode,
        message,
        data,
      });
      expect(result).toBe(mockRes);
    });

    it('should send successful response with auth token without cookie options', () => {
      // Arrange
      const message = 'Login successful';
      const data = { token: 'jwt-token' };
      const statusCode = HttpStatusCode.OK;

      // Act
      const result = ResponseFormatter.successWithAuth(
        mockRes,
        message,
        data,
        statusCode
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode,
        message,
        data,
      });
      expect(result).toBe(mockRes);
    });
  });

  describe('validationError', () => {
    it('should send validation error response', () => {
      // Arrange
      const message = 'Validation failed';
      const errors = [
        { path: 'email', message: 'Invalid email format' },
        { path: 'password', message: 'Password is required' },
      ];
      const statusCode = HttpStatusCode.BAD_REQUEST;

      // Act
      const result = ResponseFormatter.validationError(
        mockRes,
        message,
        statusCode,
        errors
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST); // validationError always uses BAD_REQUEST
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode,
        message,
        errors,
      });
      expect(result).toBe(mockRes);
    });
  });

  describe('error', () => {
    it('should send error response', () => {
      // Arrange
      const message = 'Internal server error';
      const statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;

      // Act
      const result = ResponseFormatter.error(mockRes, message, statusCode);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode,
        message,
      });
      expect(result).toBe(mockRes);
    });
  });

  describe('internalError', () => {
    it('should send internal error response', () => {
      // Arrange
      const message = 'Internal server error';
      const statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;

      // Act
      const result = ResponseFormatter.internalError(
        mockRes,
        message,
        statusCode
      );

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      ); // internalError always uses INTERNAL_SERVER_ERROR
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode,
        message,
      });
      expect(result).toBe(mockRes);
    });
  });
});

describe('handleResponse', () => {
  let mockRes: MedusaResponse;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('success responses', () => {
    it('should handle success response with data', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Success message',
        data: { id: 1, name: 'Test' },
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Success message',
        data: { id: 1, name: 'Test' },
      });
    });

    it('should handle success response without data', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.CREATED,
        message: 'Resource created',
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.CREATED,
        message: 'Resource created',
      });
    });
  });

  describe('authentication responses', () => {
    it('should handle authentication response with token', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Login successful',
        data: { token: 'jwt-token', user: { id: 1 } },
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Login successful',
        data: { token: 'jwt-token', user: { id: 1 } },
      });
    });

    it('should handle authentication response with null token', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Logout successful',
        data: { token: null },
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Logout successful',
        data: { token: null },
      });
    });

    it('should handle authentication response with empty token', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Logout successful',
        data: { token: '' },
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Logout successful',
        data: { token: '' },
      });
    });

    it('should handle authentication response with undefined token', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Logout successful',
        data: { token: undefined },
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Logout successful',
        data: { token: undefined },
      });
    });
  });

  describe('validation error responses', () => {
    it('should handle validation error response', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          { path: 'email', message: 'Invalid email format' },
          { path: 'password', message: 'Password is required' },
        ],
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.BAD_REQUEST,
        message: 'Validation failed',
        errors: [
          { path: 'email', message: 'Invalid email format' },
          { path: 'password', message: 'Password is required' },
        ],
      });
    });

    it('should handle validation error response with empty errors array', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.BAD_REQUEST,
        message: 'Validation failed',
        errors: [],
      };

      // Act
      handleResponse(mockRes, result);

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

  describe('error responses', () => {
    it('should handle error response without errors', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle response with undefined data', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Success',
        data: undefined,
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Success',
      });
    });

    it('should handle response with null data', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Success',
        data: null,
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Success',
        data: null,
      });
    });

    it('should handle response with empty string data', () => {
      // Arrange
      const result: IGenericResponse = {
        status_code: HttpStatusCode.OK,
        message: 'Success',
        data: '',
      };

      // Act
      handleResponse(mockRes, result);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCode.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        statusCode: HttpStatusCode.OK,
        message: 'Success',
        data: '',
      });
    });
  });
});
