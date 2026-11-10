// Shared TypeScript types describing the rows we send to / receive from
// the database and the API. Keeping them in one file means the repositories,
// the routes and the tests all agree on the same shapes.

/** A row of the "exercises" table. */
export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  description: string;
  created_at: string;
}

/** Data needed to create or update an exercise (no id: the DB generates it). */
export interface ExerciseInput {
  name: string;
  muscle_group: string;
  description: string;
}

/** A row of the "workouts" table. */
export interface Workout {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

/** A workout in the list page: we also show how many exercises it contains. */
export interface WorkoutSummary extends Workout {
  exercise_count: number;
}

export interface WorkoutInput {
  name: string;
  description: string;
}

/**
 * An exercise as it appears INSIDE a workout: the exercise columns plus the
 * sets and reps stored in the junction table.
 */
export interface WorkoutExercise {
  exercise_id: number;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
}

/** Sets and repetitions, the data that lives in the junction table. */
export interface SetsAndReps {
  sets: number;
  reps: number;
}

/** A workout that uses a given exercise (exercise details page). */
export interface WorkoutUsingExercise {
  workout_id: number;
  name: string;
  sets: number;
  reps: number;
}
