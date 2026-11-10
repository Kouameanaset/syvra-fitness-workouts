// TypeScript types that describe the JSON sent by the API.
// They mirror backend/src/types.ts so the front end and back end agree.
// (Types only exist while we write code: they are erased at build time.)

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  description: string;
  created_at: string;
}

/** What the exercise form sends (no id: the database creates it). */
export interface ExerciseInput {
  name: string;
  muscle_group: string;
  description: string;
}

export interface Workout {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

/** A workout in the list page: it also carries the number of exercises. */
export interface WorkoutSummary extends Workout {
  exercise_count: number;
}

export interface WorkoutInput {
  name: string;
  description: string;
}

/** An exercise as it appears INSIDE a workout, with its sets and reps. */
export interface WorkoutExercise {
  exercise_id: number;
  name: string;
  muscle_group: string;
  sets: number;
  reps: number;
}

/** GET /api/workouts/:id returns the workout plus its exercises. */
export interface WorkoutDetail extends Workout {
  exercises: WorkoutExercise[];
}

export interface SetsAndReps {
  sets: number;
  reps: number;
}

/** A workout that uses a given exercise (shown on the exercise page). */
export interface WorkoutUsingExercise {
  workout_id: number;
  name: string;
  sets: number;
  reps: number;
}

/** Per-field error messages, e.g. { name: "This field is required." }. */
export type FieldErrors = Record<string, string>;
