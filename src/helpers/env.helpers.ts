import dotenv from 'dotenv';
dotenv.config();

type TEnvironment = 'production' | 'staging' | 'development' | 'test';

function getEnv(envKey: string) {
  return process.env[envKey] ?? undefined;
}

function getEnvString(envKey: string): string {
  const val = getEnv(envKey);
  return val || '';
}

function getEnvBool(envKey: string): boolean {
  const val = getEnv(envKey);
  return val === 'true';
}

function getEnvNumber(envKey: string, defaultVal?: number): number | undefined {
  const val = getEnv(envKey);
  return val !== undefined && !isNaN(Number(val)) ? Number(val) : defaultVal;
}

export const envConfig = {
  ADMIN_CORS: getEnvString('ADMIN_CORS'),
  ADMIN_EMAIL: getEnvString('ADMIN_EMAIL') || 'hello@pricepally.com',
  ADMIN_FIRST_NAME: getEnvString('ADMIN_FIRST_NAME') || 'Pricepally',
  ADMIN_LAST_NAME: getEnvString('ADMIN_LAST_NAME') || 'Admin',
  AUTH_CORS: getEnvString('AUTH_CORS'),

  ALL_PP_USERS_CONTACT_LIST_ID: getEnvString('ALL_PP_USERS_CONTACT_LIST_ID'),
  API_KEY_TITLE: getEnvString('API_KEY_TITLE'),
  API_TIMEOUT: getEnvNumber('API_TIMEOUT') || 10000,
  AUTH_EXPIRE_TIME: getEnvString('AUTH_EXPIRE_TIME'),
  AWS_ACCESS_KEY: getEnvString('AWS_ACCESS_KEY'),
  AWS_SENDER: getEnvString('AWS_SENDER'),
  AWS_SESSION_TOKEN: getEnvString('AWS_SESSION_TOKEN'),
  AWS_SECRET_ACCESS_KEY: getEnvString('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION: getEnvString('AWS_REGION'),
  AWS_OTP_TEMPLATE: getEnvString('AWS_OTP_TEMPLATE'),

  BULL_DASHBOARD_USERNAME:
    getEnvString('BULL_DASHBOARD_USERNAME') || 'pricepally',
  BULL_DASHBOARD_PASSWORD:
    getEnvString('BULL_DASHBOARD_PASSWORD') || 'supersecret',
  BULL_DASHBOARD_COOKIE_TTL:
    getEnvNumber('BULL_DASHBOARD_COOKIE_TTL') || 600000,
  BULL_MAX_FAILED_JOBS: getEnvNumber('BULL_MAX_FAILED_JOBS') || 100000,
  BULL_MAX_COMPLETED_JOBS: getEnvNumber('BULL_MAX_COMPLETED_JOBS') || 100000,

  CACHE_DEFAULT_TTL: getEnvNumber('CACHE_DEFAULT_TTL') || 86400,
  CHATBOT_WEBHOOK_URL: getEnvString('CHATBOT_WEBHOOK_URL'),
  COOKIE_SECRET: getEnvString('COOKIE_SECRET'),
  COUNTRY_API_BASE_URL:
    getEnvString('COUNTRY_API_BASE_URL') ||
    'https://countriesnow.space/api/v0.1',

  DATABASE_URL: getEnvString('DATABASE_URL'),

  EMAIL_STRATEGY: getEnvString('EMAIL_STRATEGY'),
  MOCK_EMAIL_STRATEGY: getEnvString('MOCK_EMAIL_STRATEGY'),
  MOCK_SMS_STRATEGY: getEnvString('MOCK_SMS_STRATEGY'),
  ENABLE_CONSOLE_LOGGING: getEnvString('ENABLE_CONSOLE_LOGGING'),
  environment: getEnvString('NODE_ENV') as TEnvironment,

  FIREBASE_APP_ID: getEnvString('FIREBASE_APP_ID'),
  FIREBASE_API_KEY: getEnvString('FIREBASE_API_KEY'),
  FIREBASE_AUTH_DOMAIN: getEnvString('FIREBASE_AUTH_DOMAIN'),
  FIREBASE_CLIENT_EMAIL: getEnvString('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_MEASUREMENT_ID: getEnvString('FIREBASE_MEASUREMENT_ID'),
  FIREBASE_MESSAGING_SENDER_ID: getEnvString('FIREBASE_MESSAGING_SENDER_ID'),
  FIREBASE_PROJECT_ID: getEnvString('FIREBASE_PROJECT_ID'),
  FIREBASE_NPROJECT_ID: getEnvString('FIREBASE_NPROJECT_ID'),
  FIREBASE_PRIVATE_KEY: getEnvString('FIREBASE_PRIVATE_KEY'),
  FIREBASE_STORAGE_BUCKET: getEnvString('FIREBASE_STORAGE_BUCKET'),

  GOOGLE_CALLBACK_URL: getEnvString('GOOGLE_CALLBACK_URL'),
  GOOGLE_CLIENT_ID: getEnvString('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getEnvString('GOOGLE_CLIENT_SECRET'),
  GITHUB_CALLBACK_URL: getEnvString('GITHUB_CALLBACK_URL'),
  GITHUB_CLIENT_ID: getEnvString('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: getEnvString('GITHUB_CLIENT_SECRET'),

  JWT_SECRET: getEnvString('JWT_SECRET'),

  LOG_LEVEL: getEnvString('LOG_LEVEL'),
  LOGGER_PATH: getEnvString('LOGGER_PATH') || './logs',
  LOGGER_ROTATE_MAX_SIZE: getEnvString('LOGGER_ROTATE_MAX_SIZE'),
  LOGGER_ROTATE_MAX_AGE: getEnvString('LOGGER_ROTATE_MAX_AGE'),

  MEILISEARCH_HOST: getEnvString('MEILISEARCH_HOST'),
  MEILISEARCH_API_KEY: getEnvString('MEILISEARCH_API_KEY'),
  MAILJET_API_KEY: getEnvString('MAILJET_API_KEY'),
  MAIL_JET_SECRET_KEY: getEnvString('MAIL_JET_SECRET_KEY'),

  NODE_ENV: getEnvString('NODE_ENV'),
  NOMBA_IS_PROD: getEnvBool('NOMBA_IS_PROD'),
  NOMBA_ACCOUNT_ID: getEnvString('NOMBA_ACCOUNT_ID'),
  NOMBA_CLIENT_ID: getEnvString('NOMBA_CLIENT_ID'),
  NOMBA_PRIVATE_KEY: getEnvString('NOMBA_PRIVATE_KEY'),
  NOMBA_BVN: getEnvString('NOMBA_BVN'),
  NOMINATIM_API_BASE_URL:
    getEnvString('NOMINATIM_API_BASE_URL') ||
    'https://nominatim.openstreetmap.org',

  ODOO_DB: getEnvString('ODOO_DB'),
  ODOO_PASSWORD: getEnvString('ODOO_PASSWORD'),
  ODOO_SECRET_KEY: getEnvString('ODOO_SECRET_KEY'),
  ODOO_UID: getEnvString('ODOO_UID'), //we get this from authenticating, is there a need for this
  ODOO_URL: getEnvString('ODOO_URL'),
  ODOO_USERNAME: getEnvString('ODOO_USERNAME'),
  OTP_TTL_MINS: getEnvNumber('OTP_TTL_MINS') || 2,

  PAGA_CHECKOUT_BASE_URL_TEST:
    getEnvString('PAGA_CHECKOUT_BASE_URL_TEST') ||
    'https://beta-checkout.paga.com',
  PAGA_CHECKOUT_BASE_URL:
    getEnvString('PAGA_CHECKOUT_BASE_URL') || 'https://checkout.paga.com',
  PAGA_TEST_MODE: getEnvBool('PAGA_TEST_MODE'),
  PAGA_PUBLIC_ID: getEnvString('PAGA_PUBLIC_ID'),
  PAGA_SECRET_KEY: getEnvString('PAGA_SECRET_KEY'),
  PAGA_CHARGE_URL: getEnvString('PAGA_CHARGE_URL') || '/checkout/confirm/paga',
  PAGA_CALLBACK_URL: getEnvString('PAGA_CALLBACK_URL') || '/webhook/paga',
  PAGA_HMAC: getEnvString('PAGA_HMAC'),
  PAGA_URL_PAYMENT_METHODS: getEnvString('PAGA_URL_PAYMENT_METHODS'),

  PARTIAL_PAYMENT_THRESHOLD: getEnvNumber('PARTIAL_PAYMENT_THRESHOLD') || 100,
  PAYSTACK_SECRET_KEY: getEnvString('PAYSTACK_SECRET_KEY'),

  PRICEPALLY_BACKEND_BASE_URL:
    getEnvString('PRICEPALLY_BACKEND_BASE_URL') ||
    'https://medusadev.pricepally.com',
  PRICEPALLY_COMPANY_LOGO: getEnvString('PRICEPALLY_COMPANY_LOGO'),
  PRICEPALLY_FRONTEND_BASE_URL:
    getEnvString('PRICEPALLY_FRONTEND_BASE_URL') ||
    'https://evolve-dev.pricepally.com',
  PORT: getEnvNumber('PORT'),
  PROVIDUS_BASE_URL: getEnvString('PROVIDUS_BASE_URL'),
  PROVIDUS_CLIENT_ID: getEnvString('PROVIDUS_CLIENT_ID'),
  PROVIDUS_CLIENT_SECRET: getEnvString('PROVIDUS_CLIENT_SECRET'),

  REDIS_URL: getEnvString('REDIS_URL'),

  S3_ACCESS_KEY: getEnvString('S3_ACCESS_KEY'), //is this going to be same as AWS_ACCESS_KEY
  S3_BUCKET_NAME: getEnvString('S3_BUCKET_NAME'),
  S3_REGION: getEnvString('S3_REGION'), //is this going to be same as AWS_REGION
  S3_SECRET_ACCESS_KEY: getEnvString('S3_SECRET_ACCESS_KEY'), //is this going to be same as AWS_SECRET_ACCESS_KEY
  S3_URL: getEnvString('S3_URL'),
  SENDER: getEnvString('SENDER'),
  SMS_STRATEGY: getEnvString('SMS_STRATEGY'),
  STORE_CORS: getEnvString('STORE_CORS'),
  SUREGIFT_PASSWORD: getEnvString('SUREGIFT_PASSWORD'),
  SUREGIFT_URL: getEnvString('SUREGIFT_URL'),
  SUREGIFT_USERNAME: getEnvString('SUREGIFT_USERNAME'),

  TWILIO_ACCOUNT_SID: getEnvString('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: getEnvString('TWILIO_AUTH_TOKEN'),
  TWILIO_FROM_NUMBER: getEnvString('TWILIO_FROM_NUMBER'),
  TWILIO_WHATSAPP_FROM: getEnvString('TWILIO_WHATSAPP_FROM'),
  TWILIO_STATUS_CALLBACK_URL: getEnvString('TWILIO_STATUS_CALLBACK_URL'),

  WA_APRIL_BASE_URL: getEnvString('WA_APRIL_BASE_URL'),
  WA_APRIL_OTP_URL: getEnvString('WA_APRIL_OTP_URL'),
  WA_APRIL_RIDDLE: getEnvString('WA_APRIL_RIDDLE'),

  RATE_LIMIT_THRESHOLD: getEnvNumber('RATE_LIMIT_THRESHOLD') || 10,
  RATE_LIMIT_WINDOW: getEnvNumber('RATE_LIMIT_WINDOW') || 15,
} as const;

export class Env {
  static all(): typeof envConfig {
    return envConfig;
  }
}
