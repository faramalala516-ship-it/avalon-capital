import { createClient } from "redis";

export async function getRedis() {
  if (!process.env.REDIS_URL) {
    return null;
  }

  const client = createClient({ url: process.env.REDIS_URL });
  client.on("error", (error) => console.error("Redis error", error));
  await client.connect();
  return client;
}
