import { describe, expect, it } from "vitest";
import { HttpError } from "./errors.js";
import {
  parseAddExercise,
  parseExerciseInput,
  parseId,
  parseWorkoutInput,
} from "./validation.js";

describe("validation", () => {
  it("accepts a valid exercise and trims text", () => {
    expect(
      parseExerciseInput({ name: "  Squat ", muscle_group: "Legs" }),
    ).toEqual({ name: "Squat", muscle_group: "Legs", description: "" });
  });

  it("reports one message per invalid field", () => {
    try {
      parseExerciseInput({ name: "", muscle_group: "Wings" });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      const e = err as HttpError;
      expect(e.status).toBe(400);
      expect(e.fields).toHaveProperty("name");
      expect(e.fields).toHaveProperty("muscle_group");
    }
  });

  it("requires a workout name", () => {
    expect(() => parseWorkoutInput({ description: "x" })).toThrow(HttpError);
  });

  it("rejects non-integer or non-positive sets and reps", () => {
    expect(() => parseAddExercise({ exercise_id: 1, sets: 0, reps: 5 })).toThrow(HttpError);
    expect(() => parseAddExercise({ exercise_id: 1, sets: 3, reps: 2.5 })).toThrow(HttpError);
    expect(parseAddExercise({ exercise_id: 1, sets: 3, reps: 5 })).toEqual({
      exercise_id: 1,
      sets: 3,
      reps: 5,
    });
  });

  it("parseId accepts positive integers and rejects the rest", () => {
    expect(parseId("12")).toBe(12);
    expect(() => parseId("abc")).toThrow(HttpError);
    expect(() => parseId("-3")).toThrow(HttpError);
  });
});
