// Routes for /api/exercises.
//
// A route does three things only:
//   1. read and validate the request,
//   2. call a repository method,
//   3. send the response.
// It NEVER writes SQL: that is the repository's job.

import { Router } from "express";
import { HttpError } from "../errors.js";
import type { ExerciseRepository } from "../repositories/ExerciseRepository.js";
import { MUSCLE_GROUPS, parseExerciseInput, parseId } from "../validation.js";

// We receive the repository as a parameter (dependency injection) rather
// than importing a global one. That keeps this file easy to test.
export function exerciseRoutes(exercises: ExerciseRepository): Router {
  const router = Router();

  // GET /api/exercises            -> all exercises
  // GET /api/exercises?muscle_group=Legs -> only the Legs exercises
  router.get("/", async (req, res) => {
    const group =
      typeof req.query.muscle_group === "string" ? req.query.muscle_group : undefined;
    res.json(await exercises.findAll(group));
  });

  // GET /api/exercises/muscle-groups -> list used by the filter dropdown.
  // Declared BEFORE "/:id", otherwise Express would read "muscle-groups" as an id.
  router.get("/muscle-groups", (_req, res) => {
    res.json(MUSCLE_GROUPS);
  });

  // GET /api/exercises/:id
  router.get("/:id", async (req, res) => {
    const exercise = await exercises.findById(parseId(req.params.id));
    if (!exercise) throw new HttpError(404, "Exercise not found.");
    res.json(exercise);
  });

  // GET /api/exercises/:id/workouts -> workouts that use this exercise
  router.get("/:id/workouts", async (req, res) => {
    const id = parseId(req.params.id);
    // Check the exercise exists so we can answer 404 instead of an empty list.
    if (!(await exercises.findById(id))) {
      throw new HttpError(404, "Exercise not found.");
    }
    res.json(await exercises.findWorkouts(id));
  });

  // POST /api/exercises -> create (201 = Created)
  router.post("/", async (req, res) => {
    const input = parseExerciseInput(req.body);
    res.status(201).json(await exercises.create(input));
  });

  // PUT /api/exercises/:id -> replace the editable fields
  router.put("/:id", async (req, res) => {
    const id = parseId(req.params.id);
    const input = parseExerciseInput(req.body);
    const updated = await exercises.update(id, input);
    if (!updated) throw new HttpError(404, "Exercise not found.");
    res.json(updated);
  });

  // DELETE /api/exercises/:id -> 204 = success, nothing to send back
  router.delete("/:id", async (req, res) => {
    const deleted = await exercises.delete(parseId(req.params.id));
    if (!deleted) throw new HttpError(404, "Exercise not found.");
    res.status(204).end();
  });

  return router;
}
