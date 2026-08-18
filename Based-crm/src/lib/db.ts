import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  return new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://based:based@localhost:5432/basedcrm",
  });
}

export const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
