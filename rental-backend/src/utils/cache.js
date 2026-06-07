import { getRedisClient } from "../config/redis.config.js";

/**
 * Lấy dữ liệu từ Redis cache
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
const getCache = async (key) => {
  try {
    const client = getRedisClient();
    if (!client || !client.isReady) return null;
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
    if (!client || !client.isReady) return;
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
    if (!client || !client.isReady) return;
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
    if (!client || !client.isReady) return;
    
    const keys = [];
    for await (const key of client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(key);
    }

    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (error) {
    console.warn(`[CACHE WARNING] Failed to delete pattern "${pattern}":`, error.message);
  }
};

export { getCache, setCache, deleteCache, deletePatternCache };
