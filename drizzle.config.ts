import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // Drizzle elegirá el mejor método según la URL
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
