// Form for the sets and reps of an exercise inside a workout.
// - "Add" mode: `exerciseOptions` is given, so a select to pick the exercise
//   is shown too.
// - "Edit" mode: no options, only sets and reps.

import { useState } from "react";
import type { FormEvent } from "react";
import type { Exercise, FieldErrors, SetsAndReps } from "../types";
import { validateWholeNumber } from "../validation";
import { Field } from "./Field";
import { describeSubmitError } from "./submitError";

interface SetsRepsFormProps {
  idPrefix: string; // keeps input ids unique when several forms are on screen
  initialValues?: SetsAndReps;
  exerciseOptions?: Exercise[];
  submitLabel: string;
  onSubmit: (values: SetsAndReps & { exercise_id: number }) => Promise<void> | void;
  onCancel?: () => void;
}

export function SetsRepsForm({
  idPrefix,
  initialValues = { sets: 3, reps: 10 },
  exerciseOptions,
  submitLabel,
  onSubmit,
  onCancel,
}: SetsRepsFormProps) {
  // Number inputs still give us strings, so we keep strings in state.
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState(String(initialValues.sets));
  const [reps, setReps] = useState(String(initialValues.reps));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    const found: FieldErrors = {};
    if (exerciseOptions && exerciseId === "") found.exercise_id = "Choose an exercise.";
    const setsError = validateWholeNumber(sets);
    if (setsError) found.sets = setsError;
    const repsError = validateWholeNumber(reps);
    if (repsError) found.reps = repsError;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({ exercise_id: Number(exerciseId), sets: Number(sets), reps: Number(reps) });
      if (exerciseOptions) {
        // After adding, go back to a fresh form ready for the next exercise.
        setExerciseId("");
        setSets(String(initialValues.sets));
        setReps(String(initialValues.reps));
      }
    } catch (err) {
      const { fields, message } = describeSubmitError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form form-inline" onSubmit={handleSubmit} noValidate>
      {exerciseOptions && (
        <Field id={`${idPrefix}-exercise`} label="Exercise" error={errors.exercise_id}>
          <select
            id={`${idPrefix}-exercise`}
            value={exerciseId}
            onChange={(event) => setExerciseId(event.target.value)}
            aria-invalid={errors.exercise_id ? true : undefined}
            aria-describedby={errors.exercise_id ? `${idPrefix}-exercise-error` : undefined}
          >
            <option value="">Choose an exercise</option>
            {exerciseOptions.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} ({exercise.muscle_group})
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field id={`${idPrefix}-sets`} label="Sets" error={errors.sets}>
        <input
          id={`${idPrefix}-sets`}
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={sets}
          onChange={(event) => setSets(event.target.value)}
          aria-invalid={errors.sets ? true : undefined}
          aria-describedby={errors.sets ? `${idPrefix}-sets-error` : undefined}
        />
      </Field>

      <Field id={`${idPrefix}-reps`} label="Reps" error={errors.reps}>
        <input
          id={`${idPrefix}-reps`}
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          value={reps}
          onChange={(event) => setReps(event.target.value)}
          aria-invalid={errors.reps ? true : undefined}
          aria-describedby={errors.reps ? `${idPrefix}-reps-error` : undefined}
        />
      </Field>

      {formError && (
        <p className="field-error" role="alert">
          {formError}
        </p>
      )}

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
