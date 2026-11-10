// Form used to create AND edit a workout (name + description).
// Same pattern as ExerciseForm: controlled inputs, validate, then submit.

import { useState } from "react";
import type { FormEvent } from "react";
import type { FieldErrors, WorkoutInput } from "../types";
import { useScrollIntoViewOnMount } from "../hooks/useScrollIntoViewOnMount";
import { validateWorkout } from "../validation";
import { Field } from "./Field";
import { describeSubmitError } from "./submitError";

interface WorkoutFormProps {
  initialValues?: WorkoutInput;
  submitLabel: string;
  onSubmit: (values: WorkoutInput) => Promise<void> | void;
  onCancel: () => void;
}

const EMPTY: WorkoutInput = { name: "", description: "" };

export function WorkoutForm({
  initialValues = EMPTY,
  submitLabel,
  onSubmit,
  onCancel,
}: WorkoutFormProps) {
  const [values, setValues] = useState<WorkoutInput>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Brings the form into view when it opens (see the hook for the reason).
  const formRef = useScrollIntoViewOnMount<HTMLFormElement>();

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    const found = validateWorkout(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await onSubmit({ name: values.name.trim(), description: values.description.trim() });
    } catch (err) {
      const { fields, message } = describeSubmitError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} className="card form" onSubmit={handleSubmit} noValidate>
      <Field id="workout-name" label="Name" error={errors.name}>
        <input
          id="workout-name"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "workout-name-error" : undefined}
        />
      </Field>

      <Field id="workout-description" label="Description (optional)" error={errors.description}>
        <textarea
          id="workout-description"
          name="description"
          rows={3}
          value={values.description}
          onChange={handleChange}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "workout-description-error" : undefined}
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
