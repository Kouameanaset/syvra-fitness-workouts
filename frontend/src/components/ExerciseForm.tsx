// Form used to create AND edit an exercise.
//
// The inputs are "controlled": their value lives in React state and every
// keystroke updates that state through onChange. React is the single source
// of truth, so we can read, validate and reset the values at any time.

import { useState } from "react";
import type { FormEvent } from "react";
import type { ExerciseInput, FieldErrors } from "../types";
import { useScrollIntoViewOnMount } from "../hooks/useScrollIntoViewOnMount";
import { validateExercise } from "../validation";
import { Field } from "./Field";
import { describeSubmitError } from "./submitError";

interface ExerciseFormProps {
  initialValues?: ExerciseInput; // given when editing, empty when creating
  muscleGroups: string[]; // options of the select, loaded from the API
  submitLabel: string;
  onSubmit: (values: ExerciseInput) => Promise<void> | void;
  onCancel: () => void;
}

const EMPTY: ExerciseInput = { name: "", muscle_group: "", description: "" };

export function ExerciseForm({
  initialValues = EMPTY,
  muscleGroups,
  submitLabel,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const [values, setValues] = useState<ExerciseInput>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Brings the form into view when it opens (see the hook for the reason).
  const formRef = useScrollIntoViewOnMount<HTMLFormElement>();

  // One handler for all inputs: the input's `name` attribute tells us which
  // property of `values` to change. [event.target.name] is a computed key.
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event: FormEvent) {
    // Stop the browser from reloading the page, which is the default for forms.
    event.preventDefault();
    setFormError("");

    // 1. Check in the browser first (instant feedback, no useless request).
    const found = validateExercise(values, muscleGroups);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // 2. Send trimmed ("clean") values to the parent.
    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        muscle_group: values.muscle_group,
        description: values.description.trim(),
      });
    } catch (err) {
      // 3. The server can still refuse: show its messages under the inputs.
      const { fields, message } = describeSubmitError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    // noValidate turns off the browser's own popups so that OUR messages
    // (which are accessible and styled) are the ones shown.
    <form ref={formRef} className="card form" onSubmit={handleSubmit} noValidate>
      <Field id="exercise-name" label="Name" error={errors.name}>
        <input
          id="exercise-name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "exercise-name-error" : undefined}
        />
      </Field>

      <Field id="exercise-group" label="Muscle group" error={errors.muscle_group}>
        <select
          id="exercise-group"
          name="muscle_group"
          value={values.muscle_group}
          onChange={handleChange}
          aria-invalid={errors.muscle_group ? true : undefined}
          aria-describedby={errors.muscle_group ? "exercise-group-error" : undefined}
        >
          <option value="">Choose a muscle group</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="exercise-description"
        label="Description (optional)"
        error={errors.description}
      >
        <textarea
          id="exercise-description"
          name="description"
          rows={3}
          value={values.description}
          onChange={handleChange}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "exercise-description-error" : undefined}
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
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
