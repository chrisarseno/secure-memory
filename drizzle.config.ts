import { defineConfig } from "drizzle-kit";

// DATABASE_URL is only required for push/migrate commands, not for generate
const databaseUrl = process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/db-schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
