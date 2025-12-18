// // import { createClient } from 'redis';
// import { envConfig } from '@/helpers/env.helpers';

// export interface ICacheAdapter {
//   get(key: string): Promise<string | null>;
//   set(key: string, value: string, ttl?: number): Promise<void>;
//   delete(key: string): Promise<void>;
//   exists(key: string): Promise<boolean>;
//   clear?(): Promise<void>;
// }

// export class RedisCacheAdapter implements ICacheAdapter {
//   private client: ReturnType<typeof createClient> | null = null;

//   private async getClient() {
//     if (!this.client) {
//       this.client = createClient({
//         url: envConfig.REDIS_URL,
//       });

//       this.client.on('error', (err) => {
//         console.error('Redis Client Error:', err);
//       });

//       if (!this.client.isOpen) {
//         await this.client.connect();
//       }
//     }
//     return this.client;
//   }

//   async get(key: string): Promise<string | null> {
//     const client = await this.getClient();
//     return await client.get(key);
//   }

//   async set(key: string, value: string, ttl?: number): Promise<void> {
//     const client = await this.getClient();
//     if (ttl) {
//       await client.setEx(key, ttl, value);
//     } else {
//       await client.set(key, value);
//     }
//   }

//   async delete(key: string): Promise<void> {
//     const client = await this.getClient();
//     await client.del(key);
//   }

//   async exists(key: string): Promise<boolean> {
//     const client = await this.getClient();
//     const result = await client.exists(key);
//     return result === 1;
//   }

//   async clear(): Promise<void> {
//     const client = await this.getClient();
//     await client.flushDb();
//   }
// }

// export class InMemoryCacheAdapter implements ICacheAdapter {
//   private cache: Map<string, { value: string; expires?: number }> = new Map();

//   async get(key: string): Promise<string | null> {
//     const item = this.cache.get(key);
//     if (!item) return null;

//     if (item.expires && Date.now() > item.expires) {
//       this.cache.delete(key);
//       return null;
//     }

//     return item.value;
//   }

//   async set(key: string, value: string, ttl?: number): Promise<void> {
//     const expires = ttl ? Date.now() + ttl * 1000 : undefined;
//     this.cache.set(key, { value, expires });
//   }

//   async delete(key: string): Promise<void> {
//     this.cache.delete(key);
//   }

//   async exists(key: string): Promise<boolean> {
//     const value = await this.get(key);
//     return value !== null;
//   }

//   async clear(): Promise<void> {
//     this.cache.clear();
//   }
// }

// export interface ICacheService {
//   get(key: string): Promise<string | null>;
//   set(key: string, value: string, ttl?: number): Promise<void>;
//   delete(key: string): Promise<void>;
//   exists(key: string): Promise<boolean>;
//   clear?(): Promise<void>;
// }

// export class CacheService implements ICacheService {
//   private adapter: ICacheAdapter;
//   private static instance: CacheService;

//   constructor(adapter: ICacheAdapter) {
//     this.adapter = adapter;
//   }

//   public static getInstance(adapter?: ICacheAdapter): CacheService {
//     if (!CacheService.instance) {
//       if (!adapter) {
//         // Use Redis in production, in-memory for testing
//         adapter =
//           envConfig.NODE_ENV === 'test'
//             ? new InMemoryCacheAdapter()
//             : new RedisCacheAdapter();
//       }
//       CacheService.instance = new CacheService(adapter);
//     }
//     return CacheService.instance;
//   }

//   public static resetInstance(): void {
//     CacheService.instance = null as any;
//   }

//   async get(key: string): Promise<string | null> {
//     return await this.adapter.get(key);
//   }

//   async set(key: string, value: string, ttl?: number): Promise<void> {
//     await this.adapter.set(key, value, ttl);
//   }

//   async delete(key: string): Promise<void> {
//     await this.adapter.delete(key);
//   }

//   async exists(key: string): Promise<boolean> {
//     return await this.adapter.exists(key);
//   }

//   async clear(): Promise<void> {
//     if (this.adapter.clear) {
//       await this.adapter.clear();
//     }
//   }
// }

// // Export singleton instance for backward compatibility
// export const CacheUtil = CacheService.getInstance();

// export default CacheService;
