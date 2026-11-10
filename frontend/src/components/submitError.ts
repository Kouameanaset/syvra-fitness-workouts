// Shared by all forms: turns an error thrown while saving into something the
// form can display.

import { ApiError } from "../api/client";
import type { FieldErrors } from "../types";

export function describeSubmitError(err: unknown): { fields: FieldErrors; message: string } {
  if (err instanceof ApiError) {
    // Validation errors from the server come with one message per field.
    if (err.fields && Object.keys(err.fields).length > 0) {
      return { fields: err.fields, message: "" };
    }
    return { fields: {}, message: err.message };
  }
  return { fields: {}, message: "Something went wrong. Please try again." };
}
