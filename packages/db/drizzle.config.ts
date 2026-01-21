import { defineConfig } from "drizzle-kit";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://admin:password@localhost:5432/factory_db",
  },
  verbose: true,
});
