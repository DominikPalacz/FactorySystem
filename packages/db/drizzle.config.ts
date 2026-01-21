import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Tu musi być "url", a nie "connectionString"
    url: "postgresql://postgres:postgres@localhost:5432/factory_db?schema=public",
  },
});