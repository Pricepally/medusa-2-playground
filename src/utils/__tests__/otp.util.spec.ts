import { OtpUtil } from '@/utils/otp.util';
import { CacheService } from '@/utils/cache.util';
import { PhoneUtil } from '@/utils/phone.util';
import { EmailFactory } from '@/strategies/email/email.factory';
import { SmsFactory } from '@/strategies/sms/sms.factory';
import {
  generateMockSendOtpRequest,
  generateMockVerifyOtpRequest,
  testData,
} from '@/test-helpers/mock-data.helpers';

// Mock dependencies
jest.mock('@/utils/cache.util');
jest.mock('@/utils/phone.util');
jest.mock('@/strategies/email/email.factory');
jest.mock('@/strategies/sms/sms.factory');
jest.mock('@/helpers/env.helpers', () => ({
  envConfig: {
    OTP_TTL_MINS: 5,
    AWS_OTP_TEMPLATE: 'test-template',
  },
}));

describe('OtpUtil', () => {
  let otpUtil: OtpUtil;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock cache service
    mockCacheService = {
      exists: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    } as any;

    // Mock CacheService.getInstance to return our mock
    (CacheService.getInstance as jest.Mock).mockReturnValue(mockCacheService);

    // Mock PhoneUtil methods
    (PhoneUtil.isValidEmail as jest.Mock).mockReturnValue(true);
    (PhoneUtil.validateAndFormat as jest.Mock).mockReturnValue({
      isValid: true,
      formattedNumber: '+1234567890',
    });

    // Create OtpUtil instance
    otpUtil = new OtpUtil();
  });

  describe('sendOtp', () => {
    it('should send OTP successfully via email', async () => {
      // Arrange
      const emailRequest = generateMockSendOtpRequest({
        identifier_type: 'email',
        identifier: testData.validEmail,
      });

      mockCacheService.exists.mockResolvedValue(false);
      mockCacheService.set.mockResolvedValue();
      (EmailFactory.send as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await otpUtil.sendOtp(emailRequest);

      // Assert
      expect(result.message).toMatch(/OTP sent successfully via email/i);
      expect(mockCacheService.exists).toHaveBeenCalledWith(
        `otp:${testData.validEmail}`
      );
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(EmailFactory.send).toHaveBeenCalled();
    });

    it('should send OTP successfully via SMS', async () => {
      // Arrange
      const smsRequest = generateMockSendOtpRequest({
        identifier_type: 'phone',
        identifier: testData.validPhone,
        country_code: testData.validCountryCode,
        channel: 'sms',
      });

      const formattedPhone = '+1234567890';
      (PhoneUtil.validateAndFormat as jest.Mock).mockReturnValue({
        isValid: true,
        formattedNumber: formattedPhone,
      });

      mockCacheService.exists.mockResolvedValue(false);
      mockCacheService.set.mockResolvedValue();
      (SmsFactory.send as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await otpUtil.sendOtp(smsRequest);

      // Assert
      expect(result.message).toMatch(/OTP sent successfully via sms/i);
      expect(mockCacheService.exists).toHaveBeenCalledWith(
        `otp:${formattedPhone}`
      );
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(SmsFactory.send).toHaveBeenCalled();
    });

    it('should send OTP successfully via WhatsApp', async () => {
      // Arrange
      const whatsappRequest = generateMockSendOtpRequest({
        identifier_type: 'phone',
        identifier: testData.validPhone,
        country_code: testData.validCountryCode,
        channel: 'whatsapp',
      });

      const formattedPhone = '+1234567890';
      (PhoneUtil.validateAndFormat as jest.Mock).mockReturnValue({
        isValid: true,
        formattedNumber: formattedPhone,
      });

      mockCacheService.exists.mockResolvedValue(false);
      mockCacheService.set.mockResolvedValue();
      (SmsFactory.send as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await otpUtil.sendOtp(whatsappRequest);

      // Assert
      expect(result.message).toMatch(/OTP sent successfully via whatsapp/i);
      expect(SmsFactory.send).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'whatsapp',
        })
      );
    });

    it('should throw conflict error when OTP already exists', async () => {
      // Arrange
      const emailRequest = generateMockSendOtpRequest({
        identifier_type: 'email',
        identifier: testData.validEmail,
      });

      mockCacheService.exists.mockResolvedValue(true);

      // Act & Assert
      await expect(otpUtil.sendOtp(emailRequest)).rejects.toThrow(
        'OTP already sent, please wait for expiry before requesting a new one'
      );
    });

    it('should throw validation error for invalid email', async () => {
      // Arrange
      const emailRequest = generateMockSendOtpRequest({
        identifier_type: 'email',
        identifier: testData.invalidEmail,
      });

      (PhoneUtil.isValidEmail as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(otpUtil.sendOtp(emailRequest)).rejects.toThrow(
        'Invalid email address'
      );
    });

    it('should throw validation error for invalid phone number', async () => {
      // Arrange
      const phoneRequest = generateMockSendOtpRequest({
        identifier_type: 'phone',
        identifier: testData.invalidPhone,
        country_code: testData.validCountryCode,
      });

      (PhoneUtil.validateAndFormat as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid phone number',
      });

      // Act & Assert
      await expect(otpUtil.sendOtp(phoneRequest)).rejects.toThrow(
        'Invalid phone number'
      );
    });

    it('should throw validation error when country code is missing for phone', async () => {
      // Arrange
      const phoneRequest = generateMockSendOtpRequest({
        identifier_type: 'phone',
        identifier: testData.validPhone,
        // Missing country_code
      });

      // Override the mock for this specific test
      (PhoneUtil.validateAndFormat as jest.Mock).mockReturnValueOnce({
        isValid: false,
        error: 'Country code is required',
      });

      // Act & Assert
      await expect(otpUtil.sendOtp(phoneRequest)).rejects.toThrow(
        'Country code is required'
      );
    });

    it('should handle email sending failure', async () => {
      // Arrange
      const emailRequest = generateMockSendOtpRequest({
        identifier_type: 'email',
        identifier: testData.validEmail,
      });

      mockCacheService.exists.mockResolvedValue(false);
      mockCacheService.set.mockResolvedValue();
      mockCacheService.delete.mockResolvedValue();
      (EmailFactory.send as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(otpUtil.sendOtp(emailRequest)).rejects.toThrow(
        'Failed to send OTP, please try again'
      );
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('should handle SMS sending failure', async () => {
      // Arrange
      const smsRequest = generateMockSendOtpRequest({
        identifier_type: 'phone',
        identifier: testData.validPhone,
        country_code: testData.validCountryCode,
        channel: 'sms',
      });

      const formattedPhone = '+1234567890';
      (PhoneUtil.validateAndFormat as jest.Mock).mockReturnValue({
        isValid: true,
        formattedNumber: formattedPhone,
      });

      mockCacheService.exists.mockResolvedValue(false);
      mockCacheService.set.mockResolvedValue();
      mockCacheService.delete.mockResolvedValue();
      (SmsFactory.send as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(otpUtil.sendOtp(smsRequest)).rejects.toThrow(
        'Failed to send OTP, please try again'
      );
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('should handle authentication errors from email service', async () => {
      // Arrange
      const emailRequest = generateMockSendOtpRequest({
        identifier_type: 'email',
        identifier: testData.validEmail,
      });

      mockCacheService.exists.mockResolvedValue(false);
      mockCacheService.set.mockResolvedValue();
      mockCacheService.delete.mockResolvedValue();
      (EmailFactory.send as jest.Mock).mockRejectedValue(
        new Error('Authenticate')
      );

      // Act & Assert
      await expect(otpUtil.sendOtp(emailRequest)).rejects.toThrow(
        'Invalid credentials'
      );
      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      // Arrange
      const verifyRequest = generateMockVerifyOtpRequest({
        identifier_type: 'email',
        identifier: testData.validEmail,
        otp: testData.validOtp,
      });

      const hashedOtp = 'hashed-otp-value';
      mockCacheService.get.mockResolvedValue(hashedOtp);
      mockCacheService.delete.mockResolvedValue();

      // Mock the hashOtp method to return the same hash
      const hashOtpSpy = jest
        .spyOn(otpUtil, 'hashOtp')
        .mockReturnValue(hashedOtp);

      // Act
      const result = await otpUtil.verifyOtp(verifyRequest);

      // Assert
      expect(result.message).toBe('OTP verified successfully');
      expect(mockCacheService.get).toHaveBeenCalledWith(
        `otp:${testData.validEmail}`
      );
      expect(mockCacheService.delete).toHaveBeenCalledWith(
        `otp:${testData.validEmail}`
      );
      expect(hashOtpSpy).toHaveBeenCalledWith(testData.validOtp);

      hashOtpSpy.mockRestore();
    });

    it('should throw validation error when OTP not found', async () => {
      // Arrange
      const verifyRequest = generateMockVerifyOtpRequest({
        identifier_type: 'email',
        identifier: testData.validEmail,
        otp: testData.validOtp,
      });

      mockCacheService.get.mockResolvedValue(null);

      // Act & Assert
      await expect(otpUtil.verifyOtp(verifyRequest)).rejects.toThrow(
        'OTP not found or expired'
      );
    });

    it('should throw validation error for invalid OTP', async () => {
      // Arrange
      const verifyRequest = generateMockVerifyOtpRequest({
        identifier_type: 'email',
        identifier: testData.validEmail,
        otp: testData.invalidOtp,
      });

      const storedHash = 'stored-hash';
      const providedHash = 'different-hash';
      mockCacheService.get.mockResolvedValue(storedHash);

      // Mock the hashOtp method to return different hash
      const hashOtpSpy = jest
        .spyOn(otpUtil, 'hashOtp')
        .mockReturnValue(providedHash);

      // Act & Assert
      await expect(otpUtil.verifyOtp(verifyRequest)).rejects.toThrow(
        'Invalid OTP'
      );

      hashOtpSpy.mockRestore();
    });

    it('should verify phone OTP successfully', async () => {
      // Arrange
      const verifyRequest = generateMockVerifyOtpRequest({
        identifier_type: 'phone',
        identifier: testData.validPhone,
        country_code: testData.validCountryCode,
        otp: testData.validOtp,
      });

      const formattedPhone = '+1234567890';
      (PhoneUtil.validateAndFormat as jest.Mock).mockReturnValue({
        isValid: true,
        formattedNumber: formattedPhone,
      });

      const hashedOtp = 'hashed-otp-value';
      mockCacheService.get.mockResolvedValue(hashedOtp);
      mockCacheService.delete.mockResolvedValue();

      const hashOtpSpy = jest
        .spyOn(otpUtil, 'hashOtp')
        .mockReturnValue(hashedOtp);

      // Act
      const result = await otpUtil.verifyOtp(verifyRequest);

      // Assert
      expect(result.message).toBe('OTP verified successfully');
      expect(mockCacheService.get).toHaveBeenCalledWith(
        `otp:${formattedPhone}`
      );

      hashOtpSpy.mockRestore();
    });
  });

  describe('generateOtp', () => {
    it('should generate OTP with correct length', () => {
      // Act
      const otp = otpUtil.generateOtp();

      // Assert
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate different OTPs on multiple calls', () => {
      // Act
      const otp1 = otpUtil.generateOtp();
      const otp2 = otpUtil.generateOtp();

      // Assert
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('hashOtp', () => {
    it('should hash OTP consistently', () => {
      // Arrange
      const otp = '123456';

      // Act
      const hash1 = otpUtil.hashOtp(otp);
      const hash2 = otpUtil.hashOtp(otp);

      // Assert
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash format
    });

    it('should produce different hashes for different OTPs', () => {
      // Arrange
      const otp1 = '123456';
      const otp2 = '654321';

      // Act
      const hash1 = otpUtil.hashOtp(otp1);
      const hash2 = otpUtil.hashOtp(otp2);

      // Assert
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('formatOtpMessage', () => {
    it('should format SMS message correctly', () => {
      // Arrange
      const otp = '123456';

      // Act
      const message = otpUtil.formatOtpMessage(otp, 'sms');

      // Assert
      expect(message).toContain(otp);
      expect(message).toContain('PricePally');
      expect(message).toContain('PricePally Team');
    });

    it('should format WhatsApp message correctly', () => {
      // Arrange
      const otp = '123456';

      // Act
      const message = otpUtil.formatOtpMessage(otp, 'whatsapp');

      // Assert
      expect(message).toContain(otp);
      expect(message).toContain('🔐');
      expect(message).toContain('*PricePally Verification*');
      expect(message).toContain('Thank you for choosing PricePally!');
    });
  });

  describe('getOtpEmailTemplateData', () => {
    it('should return correct email template data', () => {
      // Arrange
      const otp = '123456';
      const email = 'test@example.com';

      // Act
      const templateData = otpUtil.getOtpEmailTemplateData(otp, email);

      // Assert
      expect(templateData).toEqual({
        otp,
        email,
        expires_in_minutes: 2,
        company_name: 'PricePally',
      });
    });
  });
});
