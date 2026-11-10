-- =====================================================================
-- Fictional seed data: 15 exercises, 5 workouts, and the links between
-- them. Run after schema.sql (done automatically by `npm run db:setup`).
-- =====================================================================

INSERT INTO exercises (name, muscle_group, description) VALUES
  ('Squat',            'Legs',      'Lower your hips until thighs are parallel to the floor, then stand up.'),
  ('Lunge',            'Legs',      'Step forward and lower the back knee toward the floor, then push back.'),
  ('Romanian Deadlift','Legs',      'Hinge at the hips with a slight knee bend, lowering the bar along the legs.'),
  ('Calf Raise',       'Legs',      'Rise onto the balls of your feet, pause, then lower slowly.'),
  ('Bench Press',      'Chest',     'Lie on a bench and press the bar up from chest level.'),
  ('Push-up',          'Chest',     'Keep a straight body and lower your chest to the floor, then push up.'),
  ('Pull-up',          'Back',      'Hang from a bar and pull your chin above it.'),
  ('Bent-over Row',    'Back',      'Hinge forward and pull the bar toward your lower ribs.'),
  ('Overhead Press',   'Shoulders', 'Press the bar from shoulder height to above your head.'),
  ('Lateral Raise',    'Shoulders', 'Raise dumbbells to the sides until arms are parallel to the floor.'),
  ('Bicep Curl',       'Arms',      'Curl dumbbells toward your shoulders without swinging.'),
  ('Tricep Dip',       'Arms',      'Lower your body between parallel bars or a bench, then push up.'),
  ('Plank',            'Core',      'Hold a straight line from head to heels on your forearms.'),
  ('Russian Twist',    'Core',      'Seated and leaning back, rotate your torso from side to side.'),
  ('Burpee',           'Full Body', 'Drop to a push-up, jump back to your feet, then jump up.');

INSERT INTO workouts (name, description) VALUES
  ('Leg Day',         'Lower-body strength session.'),
  ('Push Day',        'Chest, shoulders and triceps.'),
  ('Pull Day',        'Back and biceps.'),
  ('Core & Cardio',   'Short session for the core and conditioning.'),
  ('Full Body Basics','Beginner-friendly session that touches every muscle group.');

-- Subqueries look rows up by name so this file does not depend on the
-- ids Postgres happened to generate.
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps)
SELECT w.id, e.id, v.sets, v.reps
FROM (VALUES
  -- Leg Day
  ('Leg Day',          'Squat',             4, 8),
  ('Leg Day',          'Lunge',             3, 12),
  ('Leg Day',          'Romanian Deadlift', 3, 10),
  ('Leg Day',          'Calf Raise',        4, 15),
  -- Push Day
  ('Push Day',         'Bench Press',       4, 8),
  ('Push Day',         'Push-up',           3, 15),
  ('Push Day',         'Overhead Press',    3, 10),
  ('Push Day',         'Lateral Raise',     3, 12),
  ('Push Day',         'Tricep Dip',        3, 12),
  -- Pull Day
  ('Pull Day',         'Pull-up',           4, 6),
  ('Pull Day',         'Bent-over Row',     4, 10),
  ('Pull Day',         'Bicep Curl',        3, 12),
  -- Core & Cardio
  ('Core & Cardio',    'Plank',             3, 1),
  ('Core & Cardio',    'Russian Twist',     3, 20),
  ('Core & Cardio',    'Burpee',            4, 10),
  -- Full Body Basics (reuses exercises from other workouts)
  ('Full Body Basics', 'Squat',             3, 10),
  ('Full Body Basics', 'Push-up',           3, 10),
  ('Full Body Basics', 'Bent-over Row',     3, 10),
  ('Full Body Basics', 'Plank',             3, 1)
) AS v(workout_name, exercise_name, sets, reps)
JOIN workouts  w ON w.name = v.workout_name
JOIN exercises e ON e.name = v.exercise_name;
