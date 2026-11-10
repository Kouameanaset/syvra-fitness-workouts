import { describe, expect, it } from "vitest";
import { WorkoutExerciseRepository } from "./WorkoutExerciseRepository.js";
import { createFakeDb } from "./fakeDb.js";

describe("WorkoutExerciseRepository", () => {
  it("findByWorkout returns the exercises with their sets and reps", async () => {
    const rows = [
      { exercise_id: 1, name: "Squat", muscle_group: "Legs", sets: 4, reps: 8 },
    ];
    const { db, query } = createFakeDb(rows);
    const result = await new WorkoutExerciseRepository(db).findByWorkout(7);

    expect(result).toEqual(rows);
    const [, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(params).toEqual([7]);
  });

  it("add inserts workout id, exercise id, sets and reps in order", async () => {
    const { db, query } = createFakeDb();
    await new WorkoutExerciseRepository(db).add(7, 3, { sets: 4, reps: 10 });

    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(sql).toContain("INSERT INTO workout_exercises");
    expect(params).toEqual([7, 3, 4, 10]);
  });

  it("add lets database errors (e.g. duplicate pair) reach the caller", async () => {
    const { db, query } = createFakeDb();
    // Simulate Postgres rejecting the unique pair.
    query.mockRejectedValueOnce(Object.assign(new Error("duplicate"), { code: "23505" }));

    await expect(
      new WorkoutExerciseRepository(db).add(7, 3, { sets: 4, reps: 10 }),
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("update returns true when the link exists and false otherwise", async () => {
    const found = createFakeDb([], 1).db;
    const missing = createFakeDb([], 0).db;
    expect(await new WorkoutExerciseRepository(found).update(1, 2, { sets: 3, reps: 5 })).toBe(true);
    expect(await new WorkoutExerciseRepository(missing).update(1, 2, { sets: 3, reps: 5 })).toBe(false);
  });

  it("remove deletes only the link, using both ids", async () => {
    const { db, query } = createFakeDb([], 1);
    const removed = await new WorkoutExerciseRepository(db).remove(7, 3);

    expect(removed).toBe(true);
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(sql).toContain("DELETE FROM workout_exercises");
    expect(params).toEqual([7, 3]);
  });
});
