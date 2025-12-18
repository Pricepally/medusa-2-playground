import type { MedusaRequest } from '@medusajs/framework/http';
import { patchContext } from '@/utils/middlewares/async-context';
import { CookieUtil } from '@/utils/cookie.util';

function getBearer(req: MedusaRequest): string | undefined {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (typeof h !== 'string') return;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1];
}

/**
 * Extract and verify JWT token using AuthService
 */
async function verifyJwtToken(
  token: string,
  scope: 'store' | 'admin',
  authService: any
): Promise<{ success: boolean; decoded?: any }> {
  try {
    const decoded = await authService.verifyJwtToken(token);

    if (!decoded) return { success: false };

    if (scope === 'admin') {
      if (decoded?.user_id || decoded?.id) return { success: true, decoded };
    } else {
      if (decoded?.customer_id || decoded?.id || decoded?.actor_id)
        return { success: true, decoded };
    }

    return { success: false };
  } catch {
    return { success: false };
  }
}

/**
 * Extract identity (user_id or customer_id) from the request.
 * Priority order:
 * 1. Medusa attached user/customer
 * 2. Cookie-based authentication
 * 3. Bearer token authentication
 */
export async function extractIdentity(
  req: MedusaRequest,
  scope: 'store' | 'admin'
) {
  try {
    const maybeUserId = (req as any).user?.id || (req as any).actor_id;
    const maybeCustomerId = (req as any).customer?.id;

    // Check if Medusa already attached user/customer
    if (scope === 'admin' && maybeUserId) {
      patchContext({ user_id: String(maybeUserId), audience: 'admin' });
      return;
    }
    if (scope === 'store' && maybeCustomerId) {
      patchContext({ customer_id: String(maybeCustomerId), audience: 'store' });
      return;
    }

    // Try to get token from cookie first (for browser-based authentication)
    let token = CookieUtil.getAuthToken(req);

    // Fallback to Bearer token (for API clients)
    if (!token) token = getBearer(req) || null;

    if (token) {
      // Get AuthService from container
      const authService = (req as any).scope?.resolve?.('pp_auth');

      if (authService) {
        const { success, decoded } = await verifyJwtToken(
          token,
          scope,
          authService
        );

        if (success && decoded) {
          if (scope === 'admin') {
            patchContext({
              user_id: String(decoded.user_id || decoded.id),
              audience: 'admin',
            });
          } else {
            // For store scope, use actor_id if available, otherwise fallback to customer_id or id
            const customerId =
              decoded.actor_id || decoded.customer_id || decoded.id;
            if (customerId) {
              patchContext({
                customer_id: String(customerId),
                audience: 'store',
              });
            }
          }
        }
      }
    }
  } catch {
    patchContext({ auth_error: 'jwt_invalid' });
  }
}
