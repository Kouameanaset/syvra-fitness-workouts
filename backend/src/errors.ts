// A small custom error that carries an HTTP status code.
//
// Anywhere in the code we can `throw new HttpError(404, "Not found")`.
// The error-handling middleware in app.ts catches it and turns it into a
// JSON response with the right status, so routes stay short and readable.

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // Optional per-field messages, used for form validation errors.
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
