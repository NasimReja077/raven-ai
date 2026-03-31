// src/config/redis.config.js
import Redis from 'ioredis';
import 'dotenv/config';

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  console.log('✅ Redis Connected successfully...');
});

connection.on('error', (err) => {
  console.error('❌ Redis connection Error:', err);
});

export default Redis;
