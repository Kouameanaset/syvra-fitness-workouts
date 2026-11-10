// =====================================================================
// REPOSITORY PATTERN
//
// A repository is the single place that knows how to read and write one
// kind of data. All SQL for exercises lives in THIS file. The routes call
// methods like `exerciseRepository.findAll()` and never see a SQL string.
//
// Why it is useful:
//   - If the database or a query changes, only the repository changes.
//   - Routes stay tiny and easy to read.
//   - Tests can replace the database with a fake (see the .test.ts file).
// =====================================================================

import type { Queryable } from "../db/pool.js";
import type {
  Exercise,
  ExerciseInput,
  WorkoutUsingExercise,
} from "../types.js";

export class ExerciseRepository {
  // The database is "injected" through the constructor (dependency injection).
  // In production we pass the real pool; in tests we pass a fake.
  constructor(private readonly db: Queryable) {}

  /** All exercises, optionally filtered by muscle group. */
  async findAll(muscleGroup?: string): Promise<Exercise[]> {
    if (muscleGroup) {
      // $1 is a placeholder: the value is sent separately from the SQL text,
      // which protects against SQL injection. NEVER build SQL by gluing strings.
      const { rows } = await this.db.query<Exercise>(
        "SELECT * FROM exercises WHERE muscle_group = $1 ORDER BY name",
        [muscleGroup],
      );
      return rows;
    }
    const { rows } = await this.db.query<Exercise>(
      "SELECT * FROM exercises ORDER BY name",
    );
    return rows;
  }

  /** One exercise by id, or null if it does not exist. */
  async findById(id: number): Promise<Exercise | null> {
    const { rows } = await this.db.query<Exercise>(
      "SELECT * FROM exercises WHERE id = $1",
      [id],
    );
    return rows[0] ?? null;
  }

  /** Inserts an exercise and returns the created row (RETURNING * gives us the new id). */
  async create(input: ExerciseInput): Promise<Exercise> {
    const { rows } = await this.db.query<Exercise>(
      `INSERT INTO exercises (name, muscle_group, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.name, input.muscle_group, input.description],
    );
    return rows[0];
  }

  /** Updates an exercise. Returns the updated row, or null if the id does not exist. */
  async update(id: number, input: ExerciseInput): Promise<Exercise | null> {
    const { rows } = await this.db.query<Exercise>(
      `UPDATE exercises
          SET name = $1, muscle_group = $2, description = $3
        WHERE id = $4
        RETURNING *`,
      [input.name, input.muscle_group, input.description, id],
    );
    return rows[0] ?? null;
  }

  /** Deletes an exercise. Returns true if a row was deleted, false if the id did not exist. */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.query(
      "DELETE FROM exercises WHERE id = $1",
      [id],
    );
    // rowCount = number of rows affected by the statement.
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * The workouts that use a given exercise, with the sets and reps used in
   * each one. This JOINs the junction table to the workouts table.
   */
  async findWorkouts(exerciseId: number): Promise<WorkoutUsingExercise[]> {
    const { rows } = await this.db.query<WorkoutUsingExercise>(
      `SELECT w.id AS workout_id, w.name, we.sets, we.reps
         FROM workout_exercises we
         JOIN workouts w ON w.id = we.workout_id
        WHERE we.exercise_id = $1
        ORDER BY w.name`,
      [exerciseId],
    );
    return rows;
  }

  /** The distinct muscle groups currently in use (feeds the filter dropdown). */
  async findMuscleGroups(): Promise<string[]> {
    const { rows } = await this.db.query<{ muscle_group: string }>(
      "SELECT DISTINCT muscle_group FROM exercises ORDER BY muscle_group",
    );
    return rows.map((r) => r.muscle_group);
  }
}
