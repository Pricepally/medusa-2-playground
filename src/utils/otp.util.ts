// import { createHash, randomInt } from 'crypto';
// import type {
//   IOtpRequest,
//   IOtpResponse,
//   IOtpVerificationRequest,
//   TChannel,
// } from '@/utils/otp.types';
// import {
//   createValidationError,
//   createConflictError,
//   createUnauthorizedError,
// } from '@/utils/error-handler.util';
// import { PhoneUtil } from '@/utils/phone.util';
// import { EmailFactory } from '@/strategies/email/email.factory';
// import { SmsFactory } from '@/strategies/sms/sms.factory';
// import { envConfig } from '@/helpers/env.helpers';
// import { CacheService } from '@/utils/cache.util';
// import { logger } from '@/utils/custom-logger';

// export class OtpUtil {
//   private static readonly STANDARD_OTP_LENGTH = 6;
//   private readonly otpLength: number;
//   private readonly ttlSeconds: number;
//   private readonly cacheService: CacheService;

//   constructor() {
//     this.cacheService = CacheService.getInstance();
//     this.otpLength = OtpUtil.STANDARD_OTP_LENGTH;
//     this.ttlSeconds = envConfig.OTP_TTL_MINS * 60;
//   }

//   async sendOtp(request: IOtpRequest): Promise<IOtpResponse> {
//     logger.info(
//       `Sending Otp - type: ${request.identifier_type}, identifier: ${request.identifier}, country_code: ${request.country_code || 'N/A'}, channel: ${request.channel || 'N/A'}`
//     );

//     const { identifier } = await this.validateAndNormalizeIdentifier(request);
//     const otpKey = `otp:${identifier}`;
//     const existingOtp = await this.cacheService.exists(otpKey);

//     if (existingOtp)
//       throw createConflictError(
//         'OTP already sent, please wait for expiry before requesting a new one'
//       );

//     const otp = this.generateOtp();
//     const otpHash = this.hashOtp(otp);

//     await this.cacheService.set(otpKey, otpHash, this.ttlSeconds);

//     const isEmail = request.identifier_type === 'email';
//     const channel: TChannel | undefined = isEmail
//       ? undefined
//       : request.channel || 'sms';

//     try {
//       let sent: boolean;

//       if (isEmail) {
//         const emailPayload = {
//           to: identifier,
//           template: 'otp',
//           data: this.getOtpEmailTemplateData(otp, identifier),
//         };
//         sent = await EmailFactory.send(emailPayload);
//       } else {
//         const smsPayload = {
//           to: identifier,
//           message: this.formatOtpMessage(otp, channel!),
//           channel: channel!,
//           countryCode: request.country_code,
//           subject: undefined,
//         };
//         sent = await SmsFactory.send(smsPayload);
//       }

//       if (!sent) {
//         await this.cacheService.delete(otpKey);
//         throw createValidationError('Failed to send OTP, please try again');
//       }
//     } catch (error) {
//       await this.cacheService.delete(otpKey);

//       if (error.message === 'Authenticate') {
//         throw createUnauthorizedError('Invalid credentials');
//       } else {
//         throw error;
//       }
//     }

//     logger.info(
//       `Sent Otp method successfully - type: ${request.identifier_type}, identifier: ${request.identifier}, channel: ${isEmail ? 'email' : channel}`
//     );

//     return {
//       message: `OTP sent successfully via ${isEmail ? 'email' : channel}`,
//     };
//   }

//   async verifyOtp(
//     request: IOtpVerificationRequest
//   ): Promise<{ message: string }> {
//     logger.info(
//       `Verifying Otp - type: ${request.identifier_type}, identifier: ${request.identifier}, country_code: ${request.country_code || 'N/A'}`
//     );

//     const { identifier } = await this.validateAndNormalizeIdentifier(request);
//     const otpKey = `otp:${identifier}`;
//     const storedHash = await this.cacheService.get(otpKey);

//     if (!storedHash) throw createValidationError('OTP not found or expired');

//     const providedHash = this.hashOtp(request.otp);
//     if (storedHash !== providedHash) throw createValidationError('Invalid OTP');

//     await this.cacheService.delete(otpKey);

//     logger.info(
//       `Verified Otp method successfully - type: ${request.identifier_type}, identifier: ${request.identifier}`
//     );

//     return { message: 'OTP verified successfully' };
//   }

//   generateOtp(): string {
//     logger.info(`Generating Otp`);

//     const otp = Array.from({ length: this.otpLength }, () =>
//       randomInt(0, 10)
//     ).join('');

//     logger.info(`Generated Otp successfully`);
//     return otp;
//   }

//   hashOtp(otp: string): string {
//     logger.info(`Hashing Otp`);

//     const hash = createHash('sha256').update(otp).digest('hex');

//     logger.info(`Hashed Otp successfully`);
//     return hash;
//   }

//   formatOtpMessage(otp: string, channel: TChannel): string {
//     logger.info(`Formatting Otp Message - channel: ${channel}`);

//     const baseMessage = `Your PricePally verification code is: ${otp}. Valid for 2 minutes.`;

//     let formattedMessage: string;
//     switch (channel) {
//       case 'sms':
//         formattedMessage = `${baseMessage} - PricePally Team`;
//         break;
//       case 'whatsapp':
//         formattedMessage = `🔐 *PricePally Verification*\n\n${baseMessage}\n\nThank you for choosing PricePally!`;
//         break;
//       default:
//         formattedMessage = baseMessage;
//     }

//     logger.info(`Formatted Otp Message successfully - channel: ${channel}`);

//     return formattedMessage;
//   }

//   getOtpEmailTemplateData(
//     otp: string,
//     identifier: string
//   ): Record<string, any> {
//     logger.info(`Getting Otp Email Template Data - identifier: ${identifier}`);

//     const templateData = {
//       otp,
//       email: identifier,
//       expires_in_minutes: 2,
//       company_name: 'PricePally',
//     };

//     logger.info(
//       `Got Otp Email Template Data successfully - identifier: ${identifier}`
//     );
//     return templateData;
//   }

//   private async validateAndNormalizeIdentifier(
//     request: IOtpRequest | IOtpVerificationRequest
//   ): Promise<{ identifier: string }> {
//     logger.info(
//       `Validating And Normalizing Identifier - type: ${request.identifier_type}, identifier: ${request.identifier}, country_code: ${request.country_code || 'N/A'}`
//     );

//     if (request.identifier_type === 'phone') {
//       if (!request.country_code)
//         throw createValidationError(
//           'Country code is required for phone numbers'
//         );

//       const phoneValidation = PhoneUtil.validateAndFormat(
//         request.identifier,
//         request.country_code
//       );

//       if (!phoneValidation.isValid)
//         throw createValidationError(
//           phoneValidation.error || 'Invalid phone number'
//         );

//       logger.info(
//         `Validated And Normalized Identifier successfully - type: ${request.identifier_type}, formatted_identifier: REDACTED`
//       );

//       return {
//         identifier: phoneValidation.formattedNumber!,
//       };
//     } else if (request.identifier_type === 'email') {
//       if (!PhoneUtil.isValidEmail(request.identifier))
//         throw createValidationError('Invalid email address');

//       logger.info(
//         `Validated And Normalizing Identifier successfully - type: ${request.identifier_type}, identifier: ${request.identifier.toLowerCase()}`
//       );

//       return {
//         identifier: request.identifier.toLowerCase(),
//       };
//     }

//     throw createValidationError('Unsupported identifier type');
//   }
// }
