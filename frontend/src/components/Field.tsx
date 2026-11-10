// A label + an input + an error message, wrapped together.
// The input itself is passed as `children`, so this one component works for
// <input>, <textarea> and <select>.

import type { ReactNode } from "react";

interface FieldProps {
  id: string; // the id of the input; the label points to it with htmlFor
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="field">
      {/* htmlFor links the label to the input: clicking the label focuses the
          input and screen readers announce the label when it gets focus. */}
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
      {/* The input has aria-describedby={`${id}-error`}, so screen readers read
          this message with the input. role="alert" announces it when it appears. */}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
