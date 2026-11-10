// Repository for the JUNCTION table "workout_exercises": the link between a
// workout and an exercise, plus the sets and reps for that link.

import type { Queryable } from "../db/pool.js";
import type { SetsAndReps, WorkoutExercise } from "../types.js";

export class WorkoutExerciseRepository {
  constructor(private readonly db: Queryable) {}

  /** The exercises of one workout, with their sets and reps. */
  async findByWorkout(workoutId: number): Promise<WorkoutExercise[]> {
    const { rows } = await this.db.query<WorkoutExercise>(
      `SELECT e.id AS exercise_id, e.name, e.muscle_group, we.sets, we.reps
         FROM workout_exercises we
         JOIN exercises e ON e.id = we.exercise_id
        WHERE we.workout_id = $1
        ORDER BY we.id`, // insertion order = the order the user added them
      [workoutId],
    );
    return rows;
  }

  /**
   * Adds an exercise to a workout.
   * If the pair already exists, Postgres raises a unique-violation error
   * (code 23505) that the error middleware turns into HTTP 409.
   * If the workout or exercise does not exist, it raises 23503 (foreign key).
   */
  async add(
    workoutId: number,
    exerciseId: number,
    { sets, reps }: SetsAndReps,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps)
       VALUES ($1, $2, $3, $4)`,
      [workoutId, exerciseId, sets, reps],
    );
  }

  /** Changes the sets/reps of an exercise inside a workout. Returns false if the link does not exist. */
  async update(
    workoutId: number,
    exerciseId: number,
    { sets, reps }: SetsAndReps,
  ): Promise<boolean> {
    const result = await this.db.query(
      `UPDATE workout_exercises
          SET sets = $1, reps = $2
        WHERE workout_id = $3 AND exercise_id = $4`,
      [sets, reps, workoutId, exerciseId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /** Removes an exercise from a workout (the exercise itself is NOT deleted). */
  async remove(workoutId: number, exerciseId: number): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM workout_exercises
        WHERE workout_id = $1 AND exercise_id = $2`,
      [workoutId, exerciseId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
