// Component test: we render the form like a user would see it, then type and
// click with user-event, and check what appears / what the callback receives.

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExerciseForm } from "./ExerciseForm";

const GROUPS = ["Legs", "Chest", "Back"];

function setup() {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(
    <ExerciseForm
      muscleGroups={GROUPS}
      submitLabel="Create exercise"
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  );
  return { onSubmit, onCancel, user: userEvent.setup() };
}

describe("ExerciseForm", () => {
  it("shows validation errors and does not submit when the form is empty", async () => {
    const { onSubmit, user } = setup();

    await user.click(screen.getByRole("button", { name: "Create exercise" }));

    // Name and muscle group are required: two "required" messages appear.
    expect(screen.getAllByText("This field is required.")).toHaveLength(2);
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects a name that is too long", async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText("Name"), "x".repeat(101));
    await user.selectOptions(screen.getByLabelText("Muscle group"), "Legs");
    await user.click(screen.getByRole("button", { name: "Create exercise" }));

    expect(screen.getByText("Must be at most 100 characters.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with clean (trimmed) values when valid", async () => {
    const { onSubmit, user } = setup();

    await user.type(screen.getByLabelText("Name"), "  Squat  ");
    await user.selectOptions(screen.getByLabelText("Muscle group"), "Legs");
    await user.type(screen.getByLabelText("Description (optional)"), "Bar on the back ");
    await user.click(screen.getByRole("button", { name: "Create exercise" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Squat",
      muscle_group: "Legs",
      description: "Bar on the back",
    });
  });

  it("calls onCancel when Cancel is clicked", async () => {
    const { onCancel, user } = setup();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
