import { describe, expect, it } from "vitest";
import { ExerciseRepository } from "./ExerciseRepository.js";
import { createFakeDb } from "./fakeDb.js";

const squat = {
  id: 1,
  name: "Squat",
  muscle_group: "Legs",
  description: "",
  created_at: "2024-01-01",
};

describe("ExerciseRepository", () => {
  it("findAll without a filter selects every exercise", async () => {
    const { db, query } = createFakeDb([squat]);
    const result = await new ExerciseRepository(db).findAll();

    expect(result).toEqual([squat]);
    // Only one argument: no parameters, no WHERE clause.
    expect(query).toHaveBeenCalledWith("SELECT * FROM exercises ORDER BY name");
  });

  it("findAll with a muscle group filters using a SQL parameter", async () => {
    const { db, query } = createFakeDb([squat]);
    await new ExerciseRepository(db).findAll("Legs");

    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(sql).toContain("WHERE muscle_group = $1");
    expect(params).toEqual(["Legs"]); // value is NOT inside the SQL text
  });

  it("findById returns the exercise when it exists", async () => {
    const { db } = createFakeDb([squat]);
    expect(await new ExerciseRepository(db).findById(1)).toEqual(squat);
  });

  it("findById returns null when nothing is found", async () => {
    const { db } = createFakeDb([]);
    expect(await new ExerciseRepository(db).findById(999)).toBeNull();
  });

  it("create inserts the values in the right order and returns the new row", async () => {
    const { db, query } = createFakeDb([squat]);
    const created = await new ExerciseRepository(db).create({
      name: "Squat",
      muscle_group: "Legs",
      description: "",
    });

    expect(created).toEqual(squat);
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(sql).toContain("INSERT INTO exercises");
    expect(params).toEqual(["Squat", "Legs", ""]);
  });

  it("update returns null when the id does not exist", async () => {
    const { db } = createFakeDb([]);
    const result = await new ExerciseRepository(db).update(999, {
      name: "X",
      muscle_group: "Legs",
      description: "",
    });
    expect(result).toBeNull();
  });

  it("delete returns true when a row was deleted", async () => {
    const { db } = createFakeDb([], 1);
    expect(await new ExerciseRepository(db).delete(1)).toBe(true);
  });

  it("delete returns false when no row matched", async () => {
    const { db } = createFakeDb([], 0);
    expect(await new ExerciseRepository(db).delete(999)).toBe(false);
  });

  it("findWorkouts joins the junction table with the workouts", async () => {
    const rows = [{ workout_id: 2, name: "Leg Day", sets: 4, reps: 8 }];
    const { db, query } = createFakeDb(rows);
    const result = await new ExerciseRepository(db).findWorkouts(1);

    expect(result).toEqual(rows);
    const [sql, params] = query.mock.calls[0] as unknown as [string, unknown[]];
    expect(sql).toContain("JOIN workouts");
    expect(params).toEqual([1]);
  });

  it("findMuscleGroups returns a plain list of strings", async () => {
    const { db } = createFakeDb([{ muscle_group: "Back" }, { muscle_group: "Legs" }]);
    expect(await new ExerciseRepository(db).findMuscleGroups()).toEqual(["Back", "Legs"]);
  });
});
