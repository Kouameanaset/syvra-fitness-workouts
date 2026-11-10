// Builds the Express application. It is separate from server.ts (which
// starts listening on a port) so that the app can be created without
// opening a port or a database connection.

import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import type { Queryable } from "./db/pool.js";
import { HttpError } from "./errors.js";
import { ExerciseRepository } from "./repositories/ExerciseRepository.js";
import { WorkoutExerciseRepository } from "./repositories/WorkoutExerciseRepository.js";
import { WorkoutRepository } from "./repositories/WorkoutRepository.js";
import { exerciseRoutes } from "./routes/exercises.js";
import { workoutRoutes } from "./routes/workouts.js";

export function createApp(db: Queryable, corsOrigin: string) {
  const app = express();

  // CORS: browsers block a site (Vercel) from calling another origin (Render)
  // unless the API explicitly allows it. We only allow our own front end.
  app.use(cors({ origin: corsOrigin }));

  // Parses JSON request bodies into req.body.
  app.use(express.json());

  // Create one repository per table, all sharing the same database.
  const exercises = new ExerciseRepository(db);
  const workouts = new WorkoutRepository(db);
  const workoutExercises = new WorkoutExerciseRepository(db);

  // Health check: handy to verify the deployed API is alive.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/exercises", exerciseRoutes(exercises));
  app.use("/api/workouts", workoutRoutes(workouts, workoutExercises));

  // Unknown URL -> 404 in JSON.
  app.use((_req, _res, next) => {
    next(new HttpError(404, "Route not found."));
  });

  app.use(errorHandler);
  return app;
}

// Error-handling middleware (4 parameters: Express recognises it by that).
// Express 5 forwards errors thrown in async routes here automatically.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Errors we threw on purpose (validation, not found...).
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, fields: err.fields });
    return;
  }

  // Invalid JSON body sent by the client.
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body." });
    return;
  }

  // Postgres errors carry a "code". We translate the common ones.
  switch (err?.code) {
    case "23505": // unique_violation
      res.status(409).json({
        error: err.constraint === "workout_exercises_unique_pair"
          ? "This exercise is already in the workout."
          : "An item with this name already exists.",
      });
      return;
    case "23503": // foreign_key_violation
      res.status(404).json({ error: "The workout or exercise does not exist." });
      return;
  }

  // Anything else is a bug: log it, but do not leak details to the client.
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
};
