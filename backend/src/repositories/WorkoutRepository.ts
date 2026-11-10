// Repository for the "workouts" table. See ExerciseRepository.ts for an
// explanation of the Repository pattern. All workout SQL lives here.

import type { Queryable } from "../db/pool.js";
import type {
  Workout,
  WorkoutInput,
  WorkoutSummary,
} from "../types.js";

export class WorkoutRepository {
  constructor(private readonly db: Queryable) {}

  /**
   * All workouts with the number of exercises each one contains.
   * LEFT JOIN keeps workouts that have no exercise yet (count = 0);
   * an INNER JOIN would hide them.
   */
  async findAll(): Promise<WorkoutSummary[]> {
    const { rows } = await this.db.query<WorkoutSummary>(
      `SELECT w.*, COUNT(we.id)::int AS exercise_count
         FROM workouts w
         LEFT JOIN workout_exercises we ON we.workout_id = w.id
        GROUP BY w.id
        ORDER BY w.name`,
    );
    return rows;
  }

  async findById(id: number): Promise<Workout | null> {
    const { rows } = await this.db.query<Workout>(
      "SELECT * FROM workouts WHERE id = $1",
      [id],
    );
    return rows[0] ?? null;
  }

  async create(input: WorkoutInput): Promise<Workout> {
    const { rows } = await this.db.query<Workout>(
      `INSERT INTO workouts (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [input.name, input.description],
    );
    return rows[0];
  }

  async update(id: number, input: WorkoutInput): Promise<Workout | null> {
    const { rows } = await this.db.query<Workout>(
      `UPDATE workouts
          SET name = $1, description = $2
        WHERE id = $3
        RETURNING *`,
      [input.name, input.description, id],
    );
    return rows[0] ?? null;
  }

  /**
   * Deletes a workout. Its rows in workout_exercises are removed
   * automatically by the ON DELETE CASCADE rule in the schema.
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.db.query(
      "DELETE FROM workouts WHERE id = $1",
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
