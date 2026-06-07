import { getRedisClient } from "../config/redis.config.js";

/**
 * Lấy dữ liệu từ Redis cache
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) return null;
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`[CACHE WARNING] Failed to GET key "${key}":`, error.message);
    return null;
  }
};

/**
 * Lưu dữ liệu vào Redis cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds 
 */
const setCache = async (key, value, ttlSeconds = 300) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) return;
    await client.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  } catch (error) {
    console.warn(`[CACHE WARNING] Failed to SET key "${key}":`, error.message);
  }
};

/**
 * Xóa một cache key
 * @param {string} key 
 */
const deleteCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) return;
    await client.del(key);
  } catch (error) {
    console.warn(`[CACHE WARNING] Failed to DEL key "${key}":`, error.message);
  }
};

/**
 * Quét và xóa các cache keys theo pattern (Sử dụng SCAN tránh block single-thread của Redis)
 * @param {string} pattern 
 */
const deletePatternCache = async (pattern) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isOpen) return;
    
    let cursor = 0;
    do {
      const reply = await client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });
      cursor = reply.cursor;
      const keys = reply.keys;
      if (keys && keys.length > 0) {
        await client.del(keys);
      }
    } while (cursor !== 0);
  } catch (error) {
    console.warn(`[CACHE WARNING] Failed to delete pattern "${pattern}":`, error.message);
  }
};

export { getCache, setCache, deleteCache, deletePatternCache };
