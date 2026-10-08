import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL in .env.local");

export default defineConfig({
	out: "./drizzle",
	schema: ["./src/db/auth-schema.ts", "./src/db/schema.ts"],
	dialect: "postgresql",
	dbCredentials: { url },
});
