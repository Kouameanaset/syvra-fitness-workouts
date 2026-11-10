// Tests for the API client. We replace the real fetch with a fake one so no
// network is used, and check how responses and errors are turned into
// results or ApiError objects.

import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createExercise, deleteExercise, getExercises } from "./client";

/** Builds a minimal fake Response (only what the client reads). */
function fakeResponse(status: number, body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals(); // put the real fetch back
});

describe("api client", () => {
  it("returns the parsed JSON on success and builds the filter URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(200, [{ id: 1, name: "Squat" }]));
    vi.stubGlobal("fetch", fetchMock);

    const result = await getExercises("Full Body");

    expect(result).toEqual([{ id: 1, name: "Squat" }]);
    // First argument of the first call = the URL.
    expect(fetchMock.mock.calls[0][0]).toContain("/api/exercises?muscle_group=Full%20Body");
  });

  it("throws an ApiError with message, status and fields for a 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        fakeResponse(400, { error: "Validation failed.", fields: { name: "This field is required." } }),
      ),
    );

    const promise = createExercise({ name: "", muscle_group: "Legs", description: "" });

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      message: "Validation failed.",
      status: 400,
      fields: { name: "This field is required." },
    });
  });

  it("uses a default message when the error body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 500 })));

    await expect(getExercises()).rejects.toMatchObject({
      message: "Request failed (status 500).",
      status: 500,
    });
  });

  it("turns a network failure into an ApiError with status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(getExercises()).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      message: "Cannot reach the server. Check your connection and try again.",
    });
  });

  it("handles 204 No Content (delete) without reading a body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(deleteExercise(5)).resolves.toBeUndefined();
  });
});
