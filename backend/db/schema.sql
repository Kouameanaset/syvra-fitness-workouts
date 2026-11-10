-- =====================================================================
-- Syvra Fitness - database schema (PostgreSQL)
--
-- Three tables:
--   exercises          : the catalogue of exercises (e.g. "Squat")
--   workouts           : a named training session (e.g. "Leg Day")
--   workout_exercises  : JUNCTION table. One row = "this exercise is part
--                        of this workout, with N sets of M repetitions".
--
-- A workout has many exercises and an exercise belongs to many workouts:
-- that is a many-to-many relationship, which SQL can only express with a
-- junction table holding two foreign keys.
--
-- This script is idempotent on purpose: it drops and recreates the tables
-- so you can re-run `npm run db:setup` at any time to reset the data.
-- =====================================================================

DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS exercises;

CREATE TABLE exercises (
  id           SERIAL PRIMARY KEY,
  -- UNIQUE so we never end up with two "Squat" rows.
  name         VARCHAR(100) NOT NULL UNIQUE,
  muscle_group VARCHAR(50)  NOT NULL,
  description  TEXT         NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE workouts (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_exercises (
  id          SERIAL PRIMARY KEY,

  -- Foreign key #1. ON DELETE CASCADE: deleting a workout also deletes
  -- its rows here (otherwise they would point to nothing).
  workout_id  INTEGER NOT NULL REFERENCES workouts(id)  ON DELETE CASCADE,

  -- Foreign key #2. Same idea: deleting an exercise removes it from
  -- every workout that used it.
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,

  -- Data that belongs to the *relationship*, not to one side or the other.
  -- "3 sets of 10" only makes sense for this exercise in this workout.
  sets        INTEGER NOT NULL CHECK (sets > 0),
  reps        INTEGER NOT NULL CHECK (reps > 0),

  -- The "unique pair": the same exercise cannot be added twice to the
  -- same workout. To change sets/reps you edit the existing row.
  CONSTRAINT workout_exercises_unique_pair UNIQUE (workout_id, exercise_id)
);

-- Speeds up "which workouts use this exercise?" (exercise details page).
-- The unique pair already indexes (workout_id, exercise_id), which covers
-- lookups by workout_id, but not by exercise_id alone.
CREATE INDEX idx_workout_exercises_exercise_id
  ON workout_exercises (exercise_id);
