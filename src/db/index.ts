import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as authSchema from "./auth-schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("Missing DATABASE_URL: set it in .env.local or on Vercel");
}

/**
 * Neon through its pooler (DATABASE_URL with "-pooler"): works in serverless
 * functions and supports the transactions Better Auth needs. A small pool per
 * instance; Neon's pooler spreads the connections.
 */
const pool = new Pool({ connectionString, max: 5 });

export const db = drizzle(pool, { schema: authSchema });
