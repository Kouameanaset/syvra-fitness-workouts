// Input validation. Never trust data sent by a client: check it before it
// reaches the database. Each function either returns clean, typed data or
// throws an HttpError(400) with a message for each wrong field, so the
// front end can show the errors next to the right form inputs.

import { HttpError } from "./errors.js";
import type { ExerciseInput, SetsAndReps, WorkoutInput } from "./types.js";

/** Muscle groups accepted by the API (also used by the front-end filter). */
export const MUSCLE_GROUPS = [
  "Legs",
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Core",
  "Full Body",
] as const;

// Request bodies are "unknown" until we check them.
type Body = Record<string, unknown>;

function asBody(value: unknown): Body {
  return typeof value === "object" && value !== null ? (value as Body) : {};
}

/** A required text field: must be a non-empty string up to `max` characters. */
function requiredText(
  body: Body,
  key: string,
  max: number,
  errors: Record<string, string>,
): string {
  const value = body[key];
  if (typeof value !== "string" || value.trim() === "") {
    errors[key] = "This field is required.";
    return "";
  }
  if (value.trim().length > max) {
    errors[key] = `Must be at most ${max} characters.`;
  }
  return value.trim();
}

/** An optional text field: defaults to an empty string. */
function optionalText(
  body: Body,
  key: string,
  max: number,
  errors: Record<string, string>,
): string {
  const value = body[key];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    errors[key] = "Must be text.";
    return "";
  }
  if (value.trim().length > max) {
    errors[key] = `Must be at most ${max} characters.`;
  }
  return value.trim();
}

/** A positive whole number (used for sets, reps and ids). */
function positiveInt(
  body: Body,
  key: string,
  errors: Record<string, string>,
): number {
  const value = body[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    errors[key] = "Must be a whole number of at least 1.";
    return 0;
  }
  if (value > 1000) {
    errors[key] = "Must be at most 1000.";
  }
  return value;
}

/** Throws one HttpError(400) if any field collected an error. */
function throwIfInvalid(errors: Record<string, string>): void {
  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed.", errors);
  }
}

export function parseExerciseInput(raw: unknown): ExerciseInput {
  const body = asBody(raw);
  const errors: Record<string, string> = {};
  const name = requiredText(body, "name", 100, errors);
  const muscle_group = requiredText(body, "muscle_group", 50, errors);
  const description = optionalText(body, "description", 1000, errors);

  if (!errors.muscle_group && !(MUSCLE_GROUPS as readonly string[]).includes(muscle_group)) {
    errors.muscle_group = `Must be one of: ${MUSCLE_GROUPS.join(", ")}.`;
  }
  throwIfInvalid(errors);
  return { name, muscle_group, description };
}

export function parseWorkoutInput(raw: unknown): WorkoutInput {
  const body = asBody(raw);
  const errors: Record<string, string> = {};
  const name = requiredText(body, "name", 100, errors);
  const description = optionalText(body, "description", 1000, errors);
  throwIfInvalid(errors);
  return { name, description };
}

export function parseSetsAndReps(raw: unknown): SetsAndReps {
  const body = asBody(raw);
  const errors: Record<string, string> = {};
  const sets = positiveInt(body, "sets", errors);
  const reps = positiveInt(body, "reps", errors);
  throwIfInvalid(errors);
  return { sets, reps };
}

/** Body of "add an exercise to a workout": an exercise id plus sets and reps. */
export function parseAddExercise(
  raw: unknown,
): SetsAndReps & { exercise_id: number } {
  const body = asBody(raw);
  const errors: Record<string, string> = {};
  const exercise_id = positiveInt(body, "exercise_id", errors);
  const sets = positiveInt(body, "sets", errors);
  const reps = positiveInt(body, "reps", errors);
  throwIfInvalid(errors);
  return { exercise_id, sets, reps };
}

/** Reads a numeric id from a URL like /api/exercises/:id. */
export function parseId(raw: unknown, label = "id"): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(400, `Invalid ${label}.`);
  }
  return id;
}
