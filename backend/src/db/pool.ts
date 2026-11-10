import "dotenv/config"; // loads backend/.env into process.env (local development)
import pg from "pg";

// -------------------------------------------------------------------
// Queryable: the ONLY thing a repository needs from the database.
//
// Our repositories depend on this tiny interface instead of the whole
// pg.Pool class. Benefit: in unit tests we can hand them a fake object
// with a `query` function, so tests run instantly and need no database.
// -------------------------------------------------------------------
export interface Queryable {
  query<R = any>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: R[]; rowCount: number | null }>;
}

/**
 * Creates the real connection pool. A pool keeps several connections open
 * and reuses them, which is much faster than reconnecting for each request.
 */
export function createPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Fail early with a clear message instead of a cryptic connection error.
    throw new Error(
      "DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in.",
    );
  }
  return new pg.Pool({
    connectionString,
    // Neon requires TLS. The connection string already says sslmode=require.
    ssl: { rejectUnauthorized: false },
  });
}
