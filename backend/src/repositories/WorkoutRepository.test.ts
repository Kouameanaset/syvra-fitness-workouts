import { describe, expect, it } from "vitest";
import { WorkoutRepository } from "./WorkoutRepository.js";
import { createFakeDb } from "./fakeDb.js";

const legDay = {
  id: 1,
  name: "Leg Day",
  description: "",
  created_at: "2024-01-01",
};

describe("WorkoutRepository", () => {
  it("findAll counts exercises with a LEFT JOIN so empty workouts still appear", async () => {
    const rows = [{ ...legDay, exercise_count: 4 }];
    const { db, query } = createFakeDb(rows);
    const result = await new WorkoutRepository(db).findAll();

    expect(result).toEqual(rows);
    const [sql] = query.mock.calls[0] as unknown as [string];
    expect(sql).toContain("LEFT JOIN workout_exercises");
  });

  it("findById returns null for an unknown id", async () => {
    const { db } = createFakeDb([]);
    expect(await new WorkoutRepository(db).findById(42)).toBeNull();
  });

  it("create passes name and description as parameters", async () => {
    const { db, query } = createFakeDb([legDay]);
    const created = await new WorkoutRepository(db).create({
      name: "Leg Day",
      description: "",
    });

    expect(created).toEqual(legDay);
    const [, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(params).toEqual(["Leg Day", ""]);
  });

  it("update puts the id last in the parameters", async () => {
    const { db, query } = createFakeDb([legDay]);
    await new WorkoutRepository(db).update(1, { name: "Leg Day", description: "x" });

    const [, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(params).toEqual(["Leg Day", "x", 1]);
  });

  it("delete reports whether something was deleted", async () => {
    expect(await new WorkoutRepository(createFakeDb([], 1).db).delete(1)).toBe(true);
    expect(await new WorkoutRepository(createFakeDb([], 0).db).delete(1)).toBe(false);
  });
});
