// Run with: npm run db:setup
//
// Creates the tables (db/schema.sql) and inserts the fictional data
// (db/seed.sql) in the database pointed to by DATABASE_URL.
// WARNING: schema.sql drops the tables first, so existing data is erased.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createPool } from "./pool.js";

// __dirname does not exist in ES modules, so we rebuild it from import.meta.url.
const here = path.dirname(fileURLToPath(import.meta.url));
// src/db -> backend/db
const sqlDir = path.resolve(here, "../../db");

async function main() {
  const pool = createPool();
  try {
    const schema = await readFile(path.join(sqlDir, "schema.sql"), "utf8");
    const seed = await readFile(path.join(sqlDir, "seed.sql"), "utf8");

    // pool.query accepts several statements in one string when there are
    // no parameters, so each file can be sent in one call.
    console.log("Creating tables...");
    await pool.query(schema);
    console.log("Inserting seed data...");
    await pool.query(seed);

    const counts = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM exercises)         AS exercises,
         (SELECT COUNT(*) FROM workouts)          AS workouts,
         (SELECT COUNT(*) FROM workout_exercises) AS links`,
    );
    console.log("Done:", counts.rows[0]);
  } finally {
    await pool.end(); // close connections so the script can exit
  }
}

main().catch((err) => {
  console.error("Database setup failed:", err);
  process.exit(1);
});
