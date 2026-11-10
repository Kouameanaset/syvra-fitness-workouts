// /exercises/:id : details of one exercise and the workouts that use it.

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as api from "../api/client";
import { ExerciseForm } from "../components/ExerciseForm";
import { ErrorMessage, LoadingMessage } from "../components/StatusMessages";
import { useFetch } from "../hooks/useFetch";
import type { ExerciseInput } from "../types";

export function ExerciseDetailPage() {
  // useParams reads the ":id" part of the URL. It is always a string.
  const { id } = useParams();
  const exerciseId = Number(id);
  // useNavigate gives a function to change page from code (after deleting).
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState("");

  // The second argument [exerciseId]: reload when the URL id changes.
  const exercise = useFetch(() => api.getExercise(exerciseId), [exerciseId]);
  const workouts = useFetch(() => api.getExerciseWorkouts(exerciseId), [exerciseId]);
  const groups = useFetch(() => api.getMuscleGroups(), []);

  async function handleSave(values: ExerciseInput) {
    await api.updateExercise(exerciseId, values);
    setEditing(false);
    exercise.reload();
  }

  async function handleDelete() {
    if (!window.confirm("Delete this exercise? This cannot be undone.")) return;
    setActionError("");
    try {
      await api.deleteExercise(exerciseId);
      navigate("/exercises");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the exercise.");
    }
  }

  if (exercise.loading && !exercise.data) return <LoadingMessage text="Loading exercise..." />;
  if (exercise.error || !exercise.data) {
    return (
      <section>
        <ErrorMessage message={exercise.error ?? "Exercise not found."} onRetry={exercise.reload} />
        <p>
          <Link to="/exercises">Back to exercises</Link>
        </p>
      </section>
    );
  }

  const current = exercise.data;

  return (
    <section>
      <p>
        <Link to="/exercises">&larr; All exercises</Link>
      </p>

      <div className="page-head">
        <h1>{current.name}</h1>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {actionError && <ErrorMessage message={actionError} />}

      {editing && (
        <div className="panel">
          <h2>Edit exercise</h2>
          <ExerciseForm
            initialValues={{
              name: current.name,
              muscle_group: current.muscle_group,
              description: current.description,
            }}
            muscleGroups={groups.data ?? []}
            submitLabel="Save changes"
            onSubmit={handleSave}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <div className="card">
        <p>
          <span className="badge">{current.muscle_group}</span>
        </p>
        <p>{current.description || "No description."}</p>
      </div>

      <h2>Used in these workouts</h2>
      {workouts.loading && <LoadingMessage text="Loading workouts..." />}
      {workouts.error && <ErrorMessage message={workouts.error} onRetry={workouts.reload} />}
      {!workouts.loading && !workouts.error && workouts.data && (
        <>
          {workouts.data.length === 0 ? (
            <p className="empty">This exercise is not used in any workout yet.</p>
          ) : (
            <ul className="list">
              {workouts.data.map((workout) => (
                <li key={workout.workout_id} className="card list-item">
                  <Link to={`/workouts/${workout.workout_id}`}>{workout.name}</Link>
                  <span className="muted">
                    {workout.sets} sets &times; {workout.reps} reps
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
