// /exercises : list with a muscle-group filter, plus create / edit / delete.

import { useState } from "react";
import { Link } from "react-router-dom";
import * as api from "../api/client";
import { ExerciseForm } from "../components/ExerciseForm";
import { ErrorMessage, LoadingMessage } from "../components/StatusMessages";
import { useFetch } from "../hooks/useFetch";
import type { Exercise, ExerciseInput } from "../types";

export function ExercisesPage() {
  // "" means "All". Changing it re-runs the list request (see deps below).
  const [group, setGroup] = useState("");
  // What is the form doing? hidden, creating a new exercise, or editing one.
  const [formMode, setFormMode] = useState<"none" | "create" | Exercise>("none");
  // Error of a delete (the loading errors are handled by useFetch).
  const [actionError, setActionError] = useState("");

  const groups = useFetch(() => api.getMuscleGroups(), []);
  const exercises = useFetch(() => api.getExercises(group || undefined), [group]);

  async function handleSave(values: ExerciseInput) {
    // If this throws, ExerciseForm catches it and shows the messages.
    if (formMode === "create") {
      await api.createExercise(values);
    } else if (formMode !== "none") {
      await api.updateExercise(formMode.id, values);
    }
    setFormMode("none");
    exercises.reload();
  }

  async function handleDelete(exercise: Exercise) {
    // confirm() is the browser's built-in yes/no dialog.
    if (!window.confirm(`Delete "${exercise.name}"? This cannot be undone.`)) return;
    setActionError("");
    try {
      await api.deleteExercise(exercise.id);
      exercises.reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the exercise.");
    }
  }

  // The form needs the list of muscle groups, so wait until it is loaded.
  const muscleGroups = groups.data ?? [];

  return (
    <section>
      <div className="page-head">
        <h1>Exercises</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setFormMode("create")}
          disabled={groups.data === null}
        >
          New exercise
        </button>
      </div>

      {groups.error && <ErrorMessage message={groups.error} onRetry={groups.reload} />}

      {formMode !== "none" && (
        <div className="panel">
          <h2>{formMode === "create" ? "New exercise" : "Edit exercise"}</h2>
          {/* key makes React build a fresh form (empty state) when we switch exercise. */}
          <ExerciseForm
            key={formMode === "create" ? "create" : formMode.id}
            initialValues={
              formMode === "create"
                ? undefined
                : {
                    name: formMode.name,
                    muscle_group: formMode.muscle_group,
                    description: formMode.description,
                  }
            }
            muscleGroups={muscleGroups}
            submitLabel={formMode === "create" ? "Create exercise" : "Save changes"}
            onSubmit={handleSave}
            onCancel={() => setFormMode("none")}
          />
        </div>
      )}

      <div className="filter">
        <label htmlFor="group-filter">Muscle group</label>
        <select id="group-filter" value={group} onChange={(event) => setGroup(event.target.value)}>
          <option value="">All</option>
          {muscleGroups.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {actionError && <ErrorMessage message={actionError} />}

      {exercises.loading && <LoadingMessage text="Loading exercises..." />}
      {exercises.error && <ErrorMessage message={exercises.error} onRetry={exercises.reload} />}

      {!exercises.loading && !exercises.error && exercises.data && (
        <>
          {exercises.data.length === 0 ? (
            <p className="empty">No exercises found.</p>
          ) : (
            // On phones the CSS turns each table row into a card; data-label
            // provides the small caption shown in front of each value.
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Muscle group</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exercises.data.map((exercise) => (
                  <tr key={exercise.id}>
                    <td data-label="Name">
                      <Link to={`/exercises/${exercise.id}`}>{exercise.name}</Link>
                    </td>
                    <td data-label="Muscle group">
                      <span className="badge">{exercise.muscle_group}</span>
                    </td>
                    <td data-label="Description">{exercise.description || "-"}</td>
                    <td data-label="Actions">
                      <div className="actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => setFormMode(exercise)}
                          aria-label={`Edit ${exercise.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(exercise)}
                          aria-label={`Delete ${exercise.name}`}
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
