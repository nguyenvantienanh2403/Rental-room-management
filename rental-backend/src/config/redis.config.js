import { createClient } from "redis";
import env from "./env.config.js";

let redisClient = null;

const initRedis = async () => {
  if (!env.redis.url) {
    console.log("[REDIS] Redis URL is not configured. Caching is disabled.");
    return null;
  }

  redisClient = createClient({
    url: env.redis.url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.warn("[REDIS] Đã đạt giới hạn 5 lần thử kết nối lại. Vô hiệu hóa Redis caching.");
          return false;
        }
        return Math.min(retries * 1000, 3000);
      },
    },
  });

  redisClient.on("error", (err) => {
    if (redisClient && redisClient.isOpen) {
      console.error("[REDIS ERROR]", err.message || err.code || err);
    }
  });

  redisClient.on("connect", () => {
    console.log("[REDIS] Connecting to Redis...");
  });

  redisClient.on("ready", () => {
    console.log("[REDIS] Connected to Redis successfully and ready to use.");
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.error("[REDIS CONNECT ERROR] Failed to connect to Redis:", err.message);
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }
  return null;
};

export { initRedis, getRedisClient };
