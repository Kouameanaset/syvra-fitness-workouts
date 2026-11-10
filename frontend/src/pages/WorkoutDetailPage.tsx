// /workouts/:id : one workout with its exercises (sets x reps).
// You can edit/delete the workout, add an exercise, change its sets/reps
// and remove it.

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../api/client";
import { ErrorMessage, LoadingMessage } from "../components/StatusMessages";
import { SetsRepsForm } from "../components/SetsRepsForm";
import { WorkoutForm } from "../components/WorkoutForm";
import { useFetch } from "../hooks/useFetch";
import type { SetsAndReps, WorkoutExercise, WorkoutInput } from "../types";

export function WorkoutDetailPage() {
  const { id } = useParams();
  const workoutId = Number(id);
  const navigate = useNavigate();

  const [editingWorkout, setEditingWorkout] = useState(false);
  // id of the exercise whose sets/reps are being edited (null = none)
  const [editingExerciseId, setEditingExerciseId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const workout = useFetch(() => api.getWorkout(workoutId), [workoutId]);
  // All exercises: needed to fill the "add an exercise" select.
  const allExercises = useFetch(() => api.getExercises(), []);

  async function handleSaveWorkout(values: WorkoutInput) {
    await api.updateWorkout(workoutId, values);
    setEditingWorkout(false);
    workout.reload();
  }

  async function handleDeleteWorkout() {
    if (!window.confirm("Delete this workout? This cannot be undone.")) return;
    setActionError("");
    try {
      await api.deleteWorkout(workoutId);
      navigate("/workouts");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the workout.");
    }
  }

  async function handleAdd(values: SetsAndReps & { exercise_id: number }) {
    await api.addExerciseToWorkout(workoutId, values.exercise_id, {
      sets: values.sets,
      reps: values.reps,
    });
    workout.reload();
  }

  async function handleUpdateExercise(exerciseId: number, values: SetsAndReps) {
    await api.updateWorkoutExercise(workoutId, exerciseId, values);
    setEditingExerciseId(null);
    workout.reload();
  }

  async function handleRemove(exercise: WorkoutExercise) {
    if (!window.confirm(`Remove "${exercise.name}" from this workout?`)) return;
    setActionError("");
    try {
      await api.removeExerciseFromWorkout(workoutId, exercise.exercise_id);
      workout.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not remove the exercise.");
    }
  }

  if (workout.loading && !workout.data) return <LoadingMessage text="Loading workout..." />;
  if (workout.error || !workout.data) {
    return (
      <section>
        <ErrorMessage message={workout.error ?? "Workout not found."} onRetry={workout.reload} />
        <p>
          <Link to="/workouts">Back to workouts</Link>
        </p>
      </section>
    );
  }

  const current = workout.data;

  // Exercises that are not in the workout yet (a pair can only be added once).
  const alreadyIn = new Set(current.exercises.map((exercise) => exercise.exercise_id));
  const available = (allExercises.data ?? []).filter((exercise) => !alreadyIn.has(exercise.id));

  return (
    <section>
      <p>
        <Link to="/workouts">&larr; All workouts</Link>
      </p>

      <div className="page-head">
        <h1>{current.name}</h1>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEditingWorkout(true)}>
            Edit
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDeleteWorkout}>
            Delete
          </button>
        </div>
      </div>

      {actionError && <ErrorMessage message={actionError} />}

      {editingWorkout && (
        <div className="panel">
          <h2>Edit workout</h2>
          <WorkoutForm
            initialValues={{ name: current.name, description: current.description }}
            submitLabel="Save changes"
            onSubmit={handleSaveWorkout}
            onCancel={() => setEditingWorkout(false)}
          />
        </div>
      )}

      <p>{current.description || "No description."}</p>

      <h2>Exercises</h2>
      {current.exercises.length === 0 ? (
        <p className="empty">No exercises in this workout yet.</p>
      ) : (
        <ul className="list">
          {current.exercises.map((exercise) => (
            <li key={exercise.exercise_id} className="card list-item list-item-wrap">
              <div className="list-main">
                <Link to={`/exercises/${exercise.exercise_id}`}>{exercise.name}</Link>
                <span className="badge">{exercise.muscle_group}</span>
                <strong>
                  {exercise.sets} sets &times; {exercise.reps} reps
                </strong>
              </div>

              {editingExerciseId === exercise.exercise_id ? (
                <SetsRepsForm
                  idPrefix={`edit-${exercise.exercise_id}`}
                  initialValues={{ sets: exercise.sets, reps: exercise.reps }}
                  submitLabel="Save"
                  onSubmit={(values) =>
                    handleUpdateExercise(exercise.exercise_id, {
                      sets: values.sets,
                      reps: values.reps,
                    })
                  }
                  onCancel={() => setEditingExerciseId(null)}
                />
              ) : (
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setEditingExerciseId(exercise.exercise_id)}
                    aria-label={`Edit sets and reps of ${exercise.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    onClick={() => handleRemove(exercise)}
                    aria-label={`Remove ${exercise.name}`}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="panel">
        <h2>Add an exercise</h2>
        {allExercises.loading && <LoadingMessage text="Loading exercises..." />}
        {allExercises.error && (
          <ErrorMessage message={allExercises.error} onRetry={allExercises.reload} />
        )}
        {!allExercises.loading && !allExercises.error && available.length === 0 && (
          <p className="empty">
            No exercises left to add. <Link to="/exercises">Create a new exercise</Link>.
          </p>
        )}
        {!allExercises.loading && !allExercises.error && available.length > 0 && (
          <SetsRepsForm
            idPrefix="add"
            exerciseOptions={available}
            submitLabel="Add to workout"
            onSubmit={handleAdd}
          />
        )}
      </div>
    </section>
  );
}
