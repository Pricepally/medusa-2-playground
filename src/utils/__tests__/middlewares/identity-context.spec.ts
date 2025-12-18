jest.mock('@/utils/middlewares/async-context', () => ({
  patchContext: jest.fn(),
}));

jest.mock('@/utils/cookie.util', () => ({
  CookieUtil: {
    getAuthToken: jest.fn(),
  },
}));

import type { MedusaRequest } from '@medusajs/framework/http';
import { extractIdentity } from '@/utils/middlewares/identity-context';
import { patchContext } from '@/utils/middlewares/async-context';
import { CookieUtil } from '@/utils/cookie.util';

describe('Identity Context', () => {
  let mockReq: any;
  let mockAuthService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthService = {
      verifyJwtToken: jest.fn(),
    };

    // Mock CookieUtil to return null by default
    (CookieUtil.getAuthToken as jest.Mock).mockReturnValue(null);

    mockReq = {
      headers: {},
      scope: {
        resolve: jest.fn((serviceName) => {
          if (serviceName === 'pp_auth') {
            return mockAuthService;
          }
          return null;
        }),
      } as any,
    };
  });

  describe('Admin scope authentication', () => {
    it('should use attached user for admin scope', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      mockReq.user = mockUser;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'user-123',
        audience: 'admin',
      });
    });

    it('should use actor_id for admin scope when user.id is not available', async () => {
      // Arrange
      const mockActor = { actor_id: 'actor-123' };
      mockReq.actor_id = mockActor.actor_id;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'actor-123',
        audience: 'admin',
      });
    });

    it('should prioritize user.id over actor_id for admin scope', async () => {
      // Arrange
      const mockUser = { id: 'user-123' };
      const mockActor = { actor_id: 'actor-456' };
      mockReq.user = mockUser;
      mockReq.actor_id = mockActor.actor_id;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'user-123',
        audience: 'admin',
      });
    });

    it('should fallback to cookie authentication for admin scope', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { user_id: 'user-456', id: 'user-456' };
      (CookieUtil.getAuthToken as jest.Mock).mockReturnValue(mockToken);
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(mockToken);
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'user-456',
        audience: 'admin',
      });
    });

    it('should fallback to bearer token authentication for admin scope', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { user_id: 'user-789', id: 'user-789' };
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(mockToken);
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'user-789',
        audience: 'admin',
      });
    });

    it('should handle admin token with id field', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { id: 'user-999' }; // No user_id, only id
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'user-999',
        audience: 'admin',
      });
    });
  });

  describe('Store scope authentication', () => {
    it('should use attached customer for store scope', async () => {
      // Arrange
      const mockCustomer = { id: 'customer-123' };
      mockReq.customer = mockCustomer;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'store');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        customer_id: 'customer-123',
        audience: 'store',
      });
    });

    it('should fallback to cookie authentication for store scope', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { customer_id: 'customer-456', id: 'customer-456' };
      (CookieUtil.getAuthToken as jest.Mock).mockReturnValue(mockToken);
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'store');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(mockToken);
      expect(patchContext).toHaveBeenCalledWith({
        customer_id: 'customer-456',
        audience: 'store',
      });
    });

    it('should fallback to bearer token authentication for store scope', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { customer_id: 'customer-789', id: 'customer-789' };
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'store');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(mockToken);
      expect(patchContext).toHaveBeenCalledWith({
        customer_id: 'customer-789',
        audience: 'store',
      });
    });

    it('should prioritize actor_id for store scope', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = {
        actor_id: 'actor-123',
        customer_id: 'customer-456',
        id: 'id-789',
      };
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'store');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        customer_id: 'actor-123',
        audience: 'store',
      });
    });

    it('should fallback to customer_id when actor_id is not available', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = {
        customer_id: 'customer-456',
        id: 'id-789',
      };
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'store');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        customer_id: 'customer-456',
        audience: 'store',
      });
    });

    it('should fallback to id when neither actor_id nor customer_id is available', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { id: 'id-789' };
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'store');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        customer_id: 'id-789',
        audience: 'store',
      });
    });
  });

  describe('Token extraction', () => {
    it('should extract bearer token from Authorization header', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { user_id: 'user-123' };
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle Authorization header with different casing', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { user_id: 'user-123' };
      mockReq.headers = { Authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle malformed Authorization header', async () => {
      // Arrange
      mockReq.headers = { authorization: 'InvalidFormat' };

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).not.toHaveBeenCalled();
    });

    it('should handle empty Authorization header', async () => {
      // Arrange
      mockReq.headers = { authorization: '' };

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).not.toHaveBeenCalled();
    });

    it('should handle missing Authorization header', async () => {
      // Arrange
      mockReq.headers = {};

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle auth service errors gracefully', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      // Ensure CookieUtil returns null so we use the Bearer token
      (CookieUtil.getAuthToken as jest.Mock).mockReturnValue(null);
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockRejectedValue(
        new Error('Auth service error')
      );

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      // When auth service throws an error, verifyJwtToken catches it and returns { success: false }
      // So no context should be patched (no user_id or auth_error)
      expect(patchContext).not.toHaveBeenCalled();
    });

    it('should handle missing auth service', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockReq.scope = { resolve: jest.fn(() => null) } as any;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).not.toHaveBeenCalled();
    });

    it('should handle null scope', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockReq.scope = null as any;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).not.toHaveBeenCalled();
    });

    it('should handle undefined scope', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockReq.scope = undefined;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).not.toHaveBeenCalled();
    });

    it('should handle token verification returning null', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(null);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).not.toHaveBeenCalled();
    });

    it('should handle token verification returning undefined', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(undefined);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty token', async () => {
      // Arrange
      mockReq.headers = { authorization: 'Bearer ' };

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).not.toHaveBeenCalled();
    });

    it('should handle token with whitespace', async () => {
      // Arrange
      const mockToken = 'jwt-token-123';
      const mockDecoded = { user_id: 'user-123' };
      mockReq.headers = { authorization: `  Bearer   ${mockToken}  ` };
      mockAuthService.verifyJwtToken.mockResolvedValue(mockDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle numeric user IDs', async () => {
      // Arrange
      const mockUser = { id: 123 };
      mockReq.user = mockUser;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        user_id: '123',
        audience: 'admin',
      });
    });

    it('should handle numeric customer IDs', async () => {
      // Arrange
      const mockCustomer = { id: 456 };
      mockReq.customer = mockCustomer;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'store');

      // Assert
      expect(patchContext).toHaveBeenCalledWith({
        customer_id: '456',
        audience: 'store',
      });
    });

    it('should handle null user and customer', async () => {
      // Arrange
      mockReq.user = null;
      mockReq.customer = null;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).not.toHaveBeenCalled();
    });

    it('should handle undefined user and customer', async () => {
      // Arrange
      mockReq.user = undefined;
      mockReq.customer = undefined;

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(patchContext).not.toHaveBeenCalled();
    });
  });

  describe('Cookie vs Bearer token priority', () => {
    it('should prioritize cookie over bearer token', async () => {
      // Arrange
      const cookieToken = 'cookie-token-123';
      const bearerToken = 'bearer-token-456';
      const cookieDecoded = { user_id: 'user-cookie' };
      const bearerDecoded = { user_id: 'user-bearer' };
      (CookieUtil.getAuthToken as jest.Mock).mockReturnValue(cookieToken);
      mockReq.headers = { authorization: `Bearer ${bearerToken}` };
      mockAuthService.verifyJwtToken
        .mockResolvedValueOnce(cookieDecoded) // Cookie token verification
        .mockResolvedValueOnce(bearerDecoded); // Bearer token verification (should not be called)

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledTimes(1);
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(cookieToken);
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'user-cookie',
        audience: 'admin',
      });
    });

    it('should fallback to bearer token when cookie is not available', async () => {
      // Arrange
      const bearerToken = 'bearer-token-456';
      const bearerDecoded = { user_id: 'user-bearer' };
      (CookieUtil.getAuthToken as jest.Mock).mockReturnValue(null);
      mockReq.headers = { authorization: `Bearer ${bearerToken}` };
      mockAuthService.verifyJwtToken.mockResolvedValue(bearerDecoded);

      // Act
      await extractIdentity(mockReq as MedusaRequest, 'admin');

      // Assert
      expect(mockAuthService.verifyJwtToken).toHaveBeenCalledWith(bearerToken);
      expect(patchContext).toHaveBeenCalledWith({
        user_id: 'user-bearer',
        audience: 'admin',
      });
    });
  });
});
