// Mock environment
jest.mock('@/helpers/env.helpers', () => ({
  envConfig: {
    COOKIE_SECRET: 'test-secret-key-for-signing-cookies',
    environment: 'test' as const,
  },
}));

import { CookieUtil } from '@/utils/cookie.util';
import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';

describe('CookieUtil', () => {
  let mockReq: Partial<MedusaRequest>;
  let mockRes: Partial<MedusaResponse>;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    mockRes = {
      setHeader: jest.fn(),
      getHeader: jest.fn().mockReturnValue(undefined),
    };
  });

  describe('parseCookies', () => {
    it('should parse cookie header correctly', () => {
      // Arrange
      const cookieHeader = 'auth=token123; session=abc456; user=john';

      // Act
      const cookies = (CookieUtil as any).parseCookies(cookieHeader);

      // Assert
      expect(cookies).toEqual({
        auth: 'token123',
        session: 'abc456',
        user: 'john',
      });
    });

    it('should handle cookies with equal signs in values', () => {
      // Arrange
      const jwtToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const cookieHeader = `auth=${jwtToken}`;

      // Act
      const cookies = (CookieUtil as any).parseCookies(cookieHeader);

      // Assert
      expect(cookies.auth).toBe(jwtToken);
    });
  });

  describe('sign and unsign', () => {
    it('should sign and unsign cookie values correctly', () => {
      // Arrange
      const originalValue = 'test-token-value';

      // Act
      const signedValue = (CookieUtil as any).sign(originalValue);
      const unsignedValue = (CookieUtil as any).unsign(signedValue);

      // Assert
      expect(signedValue).toContain('.');
      expect(signedValue).not.toBe(originalValue);
      expect(unsignedValue).toBe(originalValue);
    });

    it('should return null for invalid signatures', () => {
      // Arrange
      const invalidSignedValue =
        'test-value.1234567890123456789012345678901234567890123456789012345678901234';

      // Act
      const result = (CookieUtil as any).unsign(invalidSignedValue);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('set and get', () => {
    it('should set cookie correctly', () => {
      // Arrange
      const cookieName = 'test';
      const cookieValue = 'value123';
      const cookieOptions = {
        maxAge: 3600000,
        httpOnly: true,
        secure: false,
      };

      // Act
      CookieUtil.set(
        mockRes as MedusaResponse,
        cookieName,
        cookieValue,
        cookieOptions
      );

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringContaining('test=value123'),
          expect.stringContaining('Max-Age=3600'),
          expect.stringContaining('HttpOnly'),
          expect.stringContaining('Path=/'),
          expect.stringContaining('SameSite=lax'),
        ])
      );
    });

    it('should get cookie from request', () => {
      // Arrange
      mockReq.headers = { cookie: 'test=value123; other=cookie' };
      const cookieName = 'test';

      // Act
      const value = CookieUtil.get(mockReq as MedusaRequest, cookieName);

      // Assert
      expect(value).toBe('value123');
    });

    it('should return null for non-existent cookie', () => {
      // Arrange
      mockReq.headers = { cookie: 'other=cookie' };
      const cookieName = 'nonexistent';

      // Act
      const value = CookieUtil.get(mockReq as MedusaRequest, cookieName);

      // Assert
      expect(value).toBeNull();
    });
  });

  describe('auth token methods', () => {
    it('should set auth token cookie with correct name', () => {
      // Arrange
      const authToken = 'jwt-token-here';

      // Act
      CookieUtil.setAuthToken(mockRes as MedusaResponse, authToken);

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringContaining('pp_auth_token='),
          expect.stringContaining('HttpOnly'),
          expect.stringContaining('SameSite=lax'),
          expect.stringContaining('Path=/'),
          expect.stringContaining('Max-Age=86400'),
        ])
      );
    });

    it('should get auth token from request', () => {
      // Arrange
      mockReq.headers = { cookie: 'pp_auth_token=signed-token-value' };
      const expectedToken = 'jwt-token-here';

      // Mock the unsign method to return the original token
      jest.spyOn(CookieUtil as any, 'unsign').mockReturnValue(expectedToken);

      // Act
      const token = CookieUtil.getAuthToken(mockReq as MedusaRequest);

      // Assert
      expect(token).toBe(expectedToken);
    });

    it('should clear auth token cookie', () => {
      // Arrange
      // No specific setup needed for clearing

      // Act
      CookieUtil.clearAuthToken(mockRes as MedusaResponse);

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringMatching(
            /pp_auth_token=.*Max-Age=0.*Expires=Thu, 01 Jan 1970 00:00:00 GMT.*Path=\/.*SameSite=lax/
          ),
        ])
      );
    });
  });

  describe('clear', () => {
    it('should clear cookie by setting expiration', () => {
      // Arrange
      const cookieName = 'test';

      // Act
      CookieUtil.clear(mockRes as MedusaResponse, cookieName);

      // Assert
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.arrayContaining([
          expect.stringMatching(
            /test=.*Max-Age=0.*Expires=Thu, 01 Jan 1970 00:00:00 GMT.*Path=\/.*SameSite=lax/
          ),
        ])
      );
    });
  });
});
