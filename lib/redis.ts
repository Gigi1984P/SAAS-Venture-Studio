import Redis from "ioredis";

let redisClient: Redis | null = null;

function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true, // Nur bei erstem Use verbinden
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    
    redisClient.on("connect", () => console.log("[REDIS] Connected"));
    redisClient.on("error", (err) => {
      if (err.message.includes("ECONNREFUSED")) {
        // Silent im Dev-Modus
        return;
      }
      console.error("[REDIS] Error:", err.message);
    });
  }
  return redisClient;
}

export const redis = getRedisClient();

// Cache-Helper mit Fallback (kein Error wenn Redis down)
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 86400) {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silent fail
  }
}

export async function delCache(key: string) {
  try {
    await redis.del(key);
  } catch {
    // Silent fail
  }
}
