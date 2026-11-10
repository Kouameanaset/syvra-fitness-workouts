// /workouts : list of workouts (with their exercise count) + create / edit / delete.

import { useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import { ErrorMessage, LoadingMessage } from "../components/StatusMessages";
import { WorkoutForm } from "../components/WorkoutForm";
import { useFetch } from "../hooks/useFetch";
import type { WorkoutInput, WorkoutSummary } from "../types";

export function WorkoutsPage() {
  const [formMode, setFormMode] = useState<"none" | "create" | WorkoutSummary>("none");
  const [actionError, setActionError] = useState("");

  const workouts = useFetch(() => api.getWorkouts(), []);

  async function handleSave(values: WorkoutInput) {
    if (formMode === "create") {
      await api.createWorkout(values);
    } else if (formMode !== "none") {
      await api.updateWorkout(formMode.id, values);
    }
    setFormMode("none");
    workouts.reload();
  }

  async function handleDelete(workout: WorkoutSummary) {
    if (!window.confirm(`Delete "${workout.name}"? This cannot be undone.`)) return;
    setActionError("");
    try {
      await api.deleteWorkout(workout.id);
      workouts.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the workout.");
    }
  }

  return (
    <section>
      <div className="page-head">
        <h1>Workouts</h1>
        <button type="button" className="btn btn-primary" onClick={() => setFormMode("create")}>
          New workout
        </button>
      </div>

      {formMode !== "none" && (
        <div className="panel">
          <h2>{formMode === "create" ? "New workout" : "Edit workout"}</h2>
          <WorkoutForm
            key={formMode === "create" ? "create" : formMode.id}
            initialValues={
              formMode === "create"
                ? undefined
                : { name: formMode.name, description: formMode.description }
            }
            submitLabel={formMode === "create" ? "Create workout" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setFormMode("none")}
          />
        </div>
      )}

      {actionError && <ErrorMessage message={actionError} />}

      {workouts.loading && <LoadingMessage text="Loading workouts..." />}
      {workouts.error && <ErrorMessage message={workouts.error} onRetry={workouts.reload} />}

      {!workouts.loading && !workouts.error && workouts.data && (
        <>
          {workouts.data.length === 0 ? (
            <p className="empty">No workouts yet. Create your first one!</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Exercises</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workouts.data.map((workout) => (
                  <tr key={workout.id}>
                    <td data-label="Name">
                      <Link to={`/workouts/${workout.id}`}>{workout.name}</Link>
                    </td>
                    <td data-label="Description">{workout.description || "-"}</td>
                    <td data-label="Exercises">
                      <span className="badge">{workout.exercise_count}</span>
                    </td>
                    <td data-label="Actions">
                      <div className="actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => setFormMode(workout)}
                          aria-label={`Edit ${workout.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(workout)}
                          aria-label={`Delete ${workout.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
}
