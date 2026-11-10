// Test helper: a fake database for repository unit tests.
//
// A repository only needs an object with a `query` method (see Queryable).
// Here `query` is a Vitest mock: it records each call (SQL + parameters)
// and returns whatever rows the test asked for. No real database involved,
// so the tests are fast and deterministic.

import { vi } from "vitest";
import type { Queryable } from "../db/pool.js";

export function createFakeDb(rows: unknown[] = [], rowCount?: number) {
  const query = vi.fn(async () => ({
    rows,
    // If the test does not specify rowCount, use the number of rows.
    rowCount: rowCount ?? rows.length,
  }));
  return { db: { query } as unknown as Queryable, query };
}
