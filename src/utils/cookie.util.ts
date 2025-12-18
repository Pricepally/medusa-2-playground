import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import crypto from 'crypto';
import { envConfig } from '@/helpers/env.helpers';
import { CustomError } from '@/utils/error-handler.util';

export interface ICookieOptions {
  maxAge?: number; // in milliseconds
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  domain?: string;
  path?: string;
}

export interface IAuthCookieOptions extends ICookieOptions {
  signed?: boolean;
}

export class CookieUtil {
  private static readonly AUTH_COOKIE_NAME = 'pp_auth_token';
  private static readonly DEFAULT_COOKIE_PATH = '/';
  private static readonly DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Generate HMAC signature for cookie value
   */
  private static sign(value: string): string {
    if (!envConfig.COOKIE_SECRET)
      throw new CustomError(
        'COOKIE_SECRET environment variable is required for cookie signing'
      );

    const signature = crypto
      .createHmac('sha256', envConfig.COOKIE_SECRET)
      .update(value)
      .digest('hex');

    return `${value}.${signature}`;
  }

  /**
   * Verify and extract value from signed cookie
   */
  private static unsign(signedValue: string): string | null {
    if (!envConfig.COOKIE_SECRET) {
      return null;
    }

    const lastDotIndex = signedValue.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return null;
    }

    const value = signedValue.slice(0, lastDotIndex);
    const signature = signedValue.slice(lastDotIndex + 1);

    const expectedSignature = crypto
      .createHmac('sha256', envConfig.COOKIE_SECRET)
      .update(value)
      .digest('hex');

    if (
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    )
      return value;

    return null;
  }

  /**
   * Get cookie value from request
   */
  static get(
    req: MedusaRequest,
    name: string,
    signed: boolean = false
  ): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    const cookies = this.parseCookies(cookieHeader);
    const value = cookies[name];

    if (!value) {
      return null;
    }

    if (signed) {
      return this.unsign(value);
    }

    return value;
  }

  /**
   * Set cookie in response
   */
  static set(
    res: MedusaResponse,
    name: string,
    value: string,
    options: ICookieOptions = {}
  ): void {
    const {
      maxAge = this.DEFAULT_MAX_AGE,
      httpOnly = true,
      secure = envConfig.environment === 'production',
      sameSite = 'lax',
      domain = undefined,
      path = this.DEFAULT_COOKIE_PATH,
    } = options;

    let cookieValue = value;

    // Sign the cookie if COOKIE_SECRET is available
    if (envConfig.COOKIE_SECRET) {
      cookieValue = this.sign(value);
    }

    const cookieParts: string[] = [`${name}=${cookieValue}`];

    if (maxAge !== undefined)
      cookieParts.push(`Max-Age=${Math.floor(maxAge / 1000)}`);

    if (path) cookieParts.push(`Path=${path}`);
    if (domain) cookieParts.push(`Domain=${domain}`);
    if (secure) cookieParts.push('Secure');
    if (httpOnly) cookieParts.push('HttpOnly');
    if (sameSite) cookieParts.push(`SameSite=${sameSite}`);

    const cookieString = cookieParts.join('; ');

    // Append to existing Set-Cookie headers or create new one
    const existingCookies = res.getHeader('Set-Cookie') as
      | string[]
      | string
      | undefined;
    const newCookies = Array.isArray(existingCookies)
      ? [...existingCookies, cookieString]
      : existingCookies
        ? [existingCookies, cookieString]
        : [cookieString];

    res.setHeader('Set-Cookie', newCookies);
  }

  /**
   * Clear cookie by setting it to expire immediately
   */
  static clear(
    res: MedusaResponse,
    name: string,
    options: Omit<ICookieOptions, 'maxAge'> = {}
  ): void {
    const {
      path = this.DEFAULT_COOKIE_PATH,
      domain = undefined,
      secure = envConfig.environment === 'production',
      sameSite = 'lax',
    } = options;

    const cookieParts: string[] = [`${name}=`];
    cookieParts.push('Max-Age=0');
    cookieParts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    if (path) cookieParts.push(`Path=${path}`);

    if (domain) cookieParts.push(`Domain=${domain}`);
    if (secure) cookieParts.push('Secure');
    if (sameSite) cookieParts.push(`SameSite=${sameSite}`);

    const cookieString = cookieParts.join('; ');

    // Append to existing Set-Cookie headers or create new one
    const existingCookies = res.getHeader('Set-Cookie') as
      | string[]
      | string
      | undefined;
    const newCookies = Array.isArray(existingCookies)
      ? [...existingCookies, cookieString]
      : existingCookies
        ? [existingCookies, cookieString]
        : [cookieString];

    res.setHeader('Set-Cookie', newCookies);
  }

  /**
   * Parse cookie header string into object
   */
  private static parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...rest] = cookie.trim().split('=');
      if (name && rest.length > 0) {
        cookies[name] = rest.join('=');
      }
    });

    return cookies;
  }

  /**
   * Set authentication token cookie
   */
  static setAuthToken(
    res: MedusaResponse,
    token: string,
    options: Partial<IAuthCookieOptions> = {}
  ): void {
    const authOptions: ICookieOptions = {
      maxAge: options.maxAge || this.DEFAULT_MAX_AGE,
      httpOnly: options.httpOnly !== false, // Default to true for security
      secure: options.secure ?? envConfig.environment === 'production',
      sameSite: options.sameSite || 'lax',
      domain: options.domain,
      path: options.path || this.DEFAULT_COOKIE_PATH,
    };

    this.set(res, this.AUTH_COOKIE_NAME, token, authOptions);
  }

  /**
   * Get authentication token from cookie
   */
  static getAuthToken(req: MedusaRequest): string | null {
    return this.get(req, this.AUTH_COOKIE_NAME, true); // Signed by default
  }

  /**
   * Clear authentication token cookie
   */
  static clearAuthToken(
    res: MedusaResponse,
    options: Omit<ICookieOptions, 'maxAge'> = {}
  ): void {
    this.clear(res, this.AUTH_COOKIE_NAME, options);
  }
}

export default CookieUtil;
