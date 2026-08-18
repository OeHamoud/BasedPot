import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pool?: Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your .env file, e.g. DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DBNAME"
    );
  }
  return new Pool({ connectionString: url });
}

export const pool = globalForDb.pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;
