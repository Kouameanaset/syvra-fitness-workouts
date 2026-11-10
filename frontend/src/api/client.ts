// The ONLY file that talks to the network. Every page calls the typed
// functions below instead of using fetch() directly, so URL building and
// error handling live in one place.

import type {
  Exercise,
  ExerciseInput,
  FieldErrors,
  SetsAndReps,
  Workout,
  WorkoutDetail,
  WorkoutExercise,
  WorkoutInput,
  WorkoutSummary,
  WorkoutUsingExercise,
} from "../types";

// Vite replaces import.meta.env.VITE_API_URL at build time with the value
// from the .env file (only variables starting with VITE_ reach the browser).
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * The error thrown for every failed request. It extends the built-in Error
 * and adds the HTTP status plus the optional per-field messages sent by the
 * server, so a form can show each message under the right input.
 */
export class ApiError extends Error {
  status: number;
  fields?: FieldErrors;

  constructor(message: string, status: number, fields?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}

/** Sends one request and returns the parsed JSON typed as T. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      // Only requests with a body need the JSON content type.
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch() itself rejects when the server cannot be reached at all
    // (offline, wrong URL, CORS blocked...). There is no HTTP status then.
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  // 204 = "No Content": success with an empty body (used by DELETE).
  if (response.status === 204) {
    return undefined as T;
  }

  // Read the body as JSON. If it is not valid JSON we get null instead.
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // The backend answers errors as { error: string, fields?: {...} }.
    const errorBody = (data ?? {}) as { error?: string; fields?: FieldErrors };
    throw new ApiError(
      errorBody.error ?? `Request failed (status ${response.status}).`,
      response.status,
      errorBody.fields,
    );
  }

  return data as T;
}

// ---------- Exercises ----------

export function getExercises(muscleGroup?: string): Promise<Exercise[]> {
  // encodeURIComponent makes "Full Body" safe to put in a URL.
  const query = muscleGroup ? `?muscle_group=${encodeURIComponent(muscleGroup)}` : "";
  return request<Exercise[]>(`/api/exercises${query}`);
}

export function getMuscleGroups(): Promise<string[]> {
  return request<string[]>("/api/exercises/muscle-groups");
}

export function getExercise(id: number): Promise<Exercise> {
  return request<Exercise>(`/api/exercises/${id}`);
}

export function getExerciseWorkouts(id: number): Promise<WorkoutUsingExercise[]> {
  return request<WorkoutUsingExercise[]>(`/api/exercises/${id}/workouts`);
}

export function createExercise(input: ExerciseInput): Promise<Exercise> {
  return request<Exercise>("/api/exercises", { method: "POST", body: input });
}

export function updateExercise(id: number, input: ExerciseInput): Promise<Exercise> {
  return request<Exercise>(`/api/exercises/${id}`, { method: "PUT", body: input });
}

export function deleteExercise(id: number): Promise<void> {
  return request<void>(`/api/exercises/${id}`, { method: "DELETE" });
}

// ---------- Workouts ----------

export function getWorkouts(): Promise<WorkoutSummary[]> {
  return request<WorkoutSummary[]>("/api/workouts");
}

export function getWorkout(id: number): Promise<WorkoutDetail> {
  return request<WorkoutDetail>(`/api/workouts/${id}`);
}

export function createWorkout(input: WorkoutInput): Promise<Workout> {
  return request<Workout>("/api/workouts", { method: "POST", body: input });
}

export function updateWorkout(id: number, input: WorkoutInput): Promise<Workout> {
  return request<Workout>(`/api/workouts/${id}`, { method: "PUT", body: input });
}

export function deleteWorkout(id: number): Promise<void> {
  return request<void>(`/api/workouts/${id}`, { method: "DELETE" });
}

// ---------- Exercises inside a workout ----------

export function addExerciseToWorkout(
  workoutId: number,
  exerciseId: number,
  values: SetsAndReps,
): Promise<WorkoutExercise> {
  return request<WorkoutExercise>(`/api/workouts/${workoutId}/exercises`, {
    method: "POST",
    body: { exercise_id: exerciseId, ...values },
  });
}

export function updateWorkoutExercise(
  workoutId: number,
  exerciseId: number,
  values: SetsAndReps,
): Promise<WorkoutExercise> {
  return request<WorkoutExercise>(`/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: "PUT",
    body: values,
  });
}

export function removeExerciseFromWorkout(
  workoutId: number,
  exerciseId: number,
): Promise<void> {
  return request<void>(`/api/workouts/${workoutId}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
}
