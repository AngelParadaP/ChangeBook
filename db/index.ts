// db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Creamos un pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Inicializamos Drizzle con el driver de node-postgres
export const db = drizzle(pool, { schema });
