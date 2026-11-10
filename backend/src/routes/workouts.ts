// Routes for /api/workouts and for the exercises inside a workout.
// Same rule as the other routes: no SQL here, only repository calls.

import { Router } from "express";
import { HttpError } from "../errors.js";
import type { WorkoutRepository } from "../repositories/WorkoutRepository.js";
import type { WorkoutExerciseRepository } from "../repositories/WorkoutExerciseRepository.js";
import {
  parseAddExercise,
  parseId,
  parseSetsAndReps,
  parseWorkoutInput,
} from "../validation.js";

export function workoutRoutes(
  workouts: WorkoutRepository,
  workoutExercises: WorkoutExerciseRepository,
): Router {
  const router = Router();

  // GET /api/workouts -> list with exercise counts
  router.get("/", async (_req, res) => {
    res.json(await workouts.findAll());
  });

  // GET /api/workouts/:id -> the workout AND its exercises with sets/reps
  router.get("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const workout = await workouts.findById(id);
    if (!workout) throw new HttpError(404, "Workout not found.");
    const exercises = await workoutExercises.findByWorkout(id);
    res.json({ ...workout, exercises });
  });

  // POST /api/workouts
  router.post("/", async (req, res) => {
    const input = parseWorkoutInput(req.body);
    res.status(201).json(await workouts.create(input));
  });

  // PUT /api/workouts/:id
  router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const input = parseWorkoutInput(req.body);
    const updated = await workouts.update(id, input);
    if (!updated) throw new HttpError(404, "Workout not found.");
    res.json(updated);
  });

  // DELETE /api/workouts/:id
  router.delete("/:id", async (req, res) => {
    const deleted = await workouts.delete(parseId(req.params.id));
    if (!deleted) throw new HttpError(404, "Workout not found.");
    res.status(204).end();
  });

  // ---- Exercises inside a workout (the junction table) ----

  // POST /api/workouts/:id/exercises
  // body: { exercise_id, sets, reps }
  router.post("/:id/exercises", async (req, res) => {
    const workoutId = parseId(req.params.id);
    const { exercise_id, sets, reps } = parseAddExercise(req.body);
    // A missing workout/exercise or a duplicate pair makes Postgres throw;
    // the error middleware converts those into 400/404/409 responses.
    await workoutExercises.add(workoutId, exercise_id, { sets, reps });
    res.status(201).json({ workout_id: workoutId, exercise_id, sets, reps });
  });

  // PUT /api/workouts/:id/exercises/:exerciseId
  // body: { sets, reps }
  router.put("/:id/exercises/:exerciseId", async (req, res) => {
    const workoutId = parseId(req.params.id);
    const exerciseId = parseId(req.params.exerciseId, "exercise id");
    const { sets, reps } = parseSetsAndReps(req.body);
    const updated = await workoutExercises.update(workoutId, exerciseId, { sets, reps });
    if (!updated) throw new HttpError(404, "This exercise is not in this workout.");
    res.json({ workout_id: workoutId, exercise_id: exerciseId, sets, reps });
  });

  // DELETE /api/workouts/:id/exercises/:exerciseId
  router.delete("/:id/exercises/:exerciseId", async (req, res) => {
    const workoutId = parseId(req.params.id);
    const exerciseId = parseId(req.params.exerciseId, "exercise id");
    const removed = await workoutExercises.remove(workoutId, exerciseId);
    if (!removed) throw new HttpError(404, "This exercise is not in this workout.");
    res.status(204).end();
  });

  return router;
}
