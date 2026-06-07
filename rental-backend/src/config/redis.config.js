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
  });

  redisClient.on("error", (err) => {
    console.error("[REDIS ERROR]", err.message);
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

const getRedisClient = () => redisClient;

export { initRedis, getRedisClient };
