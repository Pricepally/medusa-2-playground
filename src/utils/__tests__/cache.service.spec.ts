import { CacheService, InMemoryCacheAdapter } from '@/utils/cache.util';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService(new InMemoryCacheAdapter());
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      // Arrange
      // Act
      await cacheService.set('test-key', 'test-value');
      const result = await cacheService.get('test-key');

      // Assert
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent key', async () => {
      // Arrange
      // Act
      const result = await cacheService.get('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      // Arrange
      await cacheService.set('test-key', 'test-value');

      // Act
      await cacheService.delete('test-key');
      const result = await cacheService.get('test-key');

      // Assert
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      // Arrange
      await cacheService.set('test-key', 'test-value');

      // Act & Assert
      expect(await cacheService.exists('test-key')).toBe(true);
      expect(await cacheService.exists('non-existent')).toBe(false);
    });
  });

  describe('OTP Operations', () => {
    it('should set and get OTP', async () => {
      // Arrange
      // Act
      await cacheService.set('otp:test@example.com', 'hashed-otp', 300);
      const result = await cacheService.get('otp:test@example.com');

      // Assert
      expect(result).toBe('hashed-otp');
    });

    it('should check if OTP exists', async () => {
      // Arrange
      await cacheService.set('otp:test@example.com', 'hashed-otp', 300);

      // Act & Assert
      expect(await cacheService.exists('otp:test@example.com')).toBe(true);
      expect(await cacheService.exists('otp:other@example.com')).toBe(false);
    });

    it('should delete OTP', async () => {
      // Arrange
      await cacheService.set('otp:test@example.com', 'hashed-otp', 300);

      // Act
      await cacheService.delete('otp:test@example.com');
      const result = await cacheService.get('otp:test@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('TTL Operations', () => {
    it('should respect TTL for set operation', async () => {
      // Arrange
      await cacheService.set('test-key', 'test-value', 1); // 1 second TTL

      // Act & Assert - Should exist immediately
      expect(await cacheService.exists('test-key')).toBe(true);

      // Act - Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Assert - Should not exist after TTL
      expect(await cacheService.exists('test-key')).toBe(false);
    });
  });
});

describe('InMemoryCacheAdapter', () => {
  let adapter: InMemoryCacheAdapter;

  beforeEach(() => {
    adapter = new InMemoryCacheAdapter();
  });

  it('should handle expiration correctly', async () => {
    // Arrange
    await adapter.set('test-key', 'test-value', 1);

    // Act & Assert - Should exist immediately
    expect(await adapter.exists('test-key')).toBe(true);

    // Act - Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Assert - Should not exist after TTL
    expect(await adapter.exists('test-key')).toBe(false);
    expect(await adapter.get('test-key')).toBeNull();
  });
});
