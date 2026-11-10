// Client-side validation. It mirrors the rules of backend/src/validation.ts
// so users get instant feedback. The server still re-checks everything: we
// never trust the browser alone.
//
// Each function returns an object of error messages keyed by field name.
// An empty object means "valid".

import type { FieldErrors } from "./types";

export function validateExercise(
  values: { name: string; muscle_group: string; description: string },
  muscleGroups: string[],
): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();

  if (name === "") errors.name = "This field is required.";
  else if (name.length > 100) errors.name = "Must be at most 100 characters.";

  if (values.muscle_group === "") errors.muscle_group = "This field is required.";
  else if (!muscleGroups.includes(values.muscle_group)) {
    errors.muscle_group = `Must be one of: ${muscleGroups.join(", ")}.`;
  }

  if (values.description.trim().length > 1000) {
    errors.description = "Must be at most 1000 characters.";
  }
  return errors;
}

export function validateWorkout(values: { name: string; description: string }): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();

  if (name === "") errors.name = "This field is required.";
  else if (name.length > 100) errors.name = "Must be at most 100 characters.";

  if (values.description.trim().length > 1000) {
    errors.description = "Must be at most 1000 characters.";
  }
  return errors;
}

/**
 * Checks one number typed in an input. Input values are always strings, so we
 * convert with Number() and make sure it is a whole number from 1 to 1000.
 * Returns an error message, or "" when the value is fine.
 */
export function validateWholeNumber(text: string): string {
  const value = Number(text);
  if (text.trim() === "" || !Number.isInteger(value) || value < 1) {
    return "Must be a whole number of at least 1.";
  }
  if (value > 1000) return "Must be at most 1000.";
  return "";
}
