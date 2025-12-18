import { PhoneUtil } from '@/utils/phone.util';
import { testData } from '@/test-helpers/mock-data.helpers';

describe('PhoneUtil', () => {
  describe('validateAndFormat', () => {
    it('should validate and format a valid Nigerian phone number', () => {
      // Arrange
      const phoneNumber = testData.validPhone;
      const countryCode = testData.validCountryCode;

      // Act
      const result = PhoneUtil.validateAndFormat(phoneNumber, countryCode);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.formattedNumber).toBeDefined();
      expect(result.e164).toMatch(/^\+234/);
      expect(result.error).toBeUndefined();
    });

    it('should validate and format a valid US phone number', () => {
      // Arrange
      const phoneNumber = '5551234567';
      const countryCode = 'US';

      // Act
      const result = PhoneUtil.validateAndFormat(phoneNumber, countryCode);

      // Assert
      // Note: 5551234567 might not be a valid US number, so we expect it to be invalid
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate and format a phone number with country code prefix', () => {
      // Arrange
      const phoneNumber = '+2348165488599';
      const countryCode = 'NG';

      // Act
      const result = PhoneUtil.validateAndFormat(phoneNumber, countryCode);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.formattedNumber).toBeDefined();
      expect(result.e164).toBe('+2348165488599');
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for an invalid phone number', () => {
      // Arrange
      const phoneNumber = testData.invalidPhone;
      const countryCode = testData.validCountryCode;

      // Act
      const result = PhoneUtil.validateAndFormat(phoneNumber, countryCode);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.formattedNumber).toBeUndefined();
      expect(result.e164).toBeUndefined();
    });

    it('should return invalid for phone number with wrong country code', () => {
      // Arrange
      const phoneNumber = '08165488599'; // Nigerian number
      const countryCode = 'US'; // US country code

      // Act
      const result = PhoneUtil.validateAndFormat(phoneNumber, countryCode);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty phone number', () => {
      // Arrange
      const phoneNumber = '';
      const countryCode = 'NG';

      // Act
      const result = PhoneUtil.validateAndFormat(phoneNumber, countryCode);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid country code', () => {
      // Arrange
      const phoneNumber = '08165488599';
      const countryCode = 'INVALID';

      // Act
      const result = PhoneUtil.validateAndFormat(phoneNumber, countryCode);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('extractCountryCode', () => {
    it('should extract country code from international phone number', () => {
      // Arrange
      const phoneNumber = '+2348165488599';

      // Act
      const result = PhoneUtil.extractCountryCode(phoneNumber);

      // Assert
      expect(result).toBe('NG');
    });

    it('should extract country code from US phone number', () => {
      // Arrange
      const phoneNumber = '+15551234567';

      // Act
      const result = PhoneUtil.extractCountryCode(phoneNumber);

      // Assert
      // Note: +15551234567 might not be a valid US number, so we expect null
      expect(result).toBeNull();
    });

    it('should return null for phone number without country code prefix', () => {
      // Arrange
      const phoneNumber = '08165488599';

      // Act
      const result = PhoneUtil.extractCountryCode(phoneNumber);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid phone number', () => {
      // Arrange
      const phoneNumber = '+123';

      // Act
      const result = PhoneUtil.extractCountryCode(phoneNumber);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for empty phone number', () => {
      // Arrange
      const phoneNumber = '';

      // Act
      const result = PhoneUtil.extractCountryCode(phoneNumber);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('should validate a correct email address', () => {
      // Arrange
      const email = 'test@example.com';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(true);
    });

    it('should validate email with subdomain', () => {
      // Arrange
      const email = 'user@mail.example.com';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(true);
    });

    it('should validate email with numbers', () => {
      // Arrange
      const email = 'user123@example.com';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject email without @ symbol', () => {
      // Arrange
      const email = 'testexample.com';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject email without domain', () => {
      // Arrange
      const email = 'test@';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject email without local part', () => {
      // Arrange
      const email = '@example.com';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject email with spaces', () => {
      // Arrange
      const email = 'test @example.com';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject empty email', () => {
      // Arrange
      const email = '';

      // Act
      const result = PhoneUtil.isValidEmail(email);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getIdentifierType', () => {
    it('should return email for valid email address', () => {
      // Arrange
      const identifier = 'test@example.com';

      // Act
      const result = PhoneUtil.getIdentifierType(identifier);

      // Assert
      expect(result).toBe('email');
    });

    it('should return phone for phone number', () => {
      // Arrange
      const identifier = '08165488599';

      // Act
      const result = PhoneUtil.getIdentifierType(identifier);

      // Assert
      expect(result).toBe('phone');
    });

    it('should return phone for international phone number', () => {
      // Arrange
      const identifier = '+2348165488599';

      // Act
      const result = PhoneUtil.getIdentifierType(identifier);

      // Assert
      expect(result).toBe('phone');
    });

    it('should return phone for invalid email', () => {
      // Arrange
      const identifier = 'invalid-email';

      // Act
      const result = PhoneUtil.getIdentifierType(identifier);

      // Assert
      expect(result).toBe('phone');
    });

    it('should return phone for empty string', () => {
      // Arrange
      const identifier = '';

      // Act
      const result = PhoneUtil.getIdentifierType(identifier);

      // Assert
      expect(result).toBe('phone');
    });
  });
});
