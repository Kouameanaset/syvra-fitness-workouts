// Runs before every test file.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// Adds matchers such as toBeInTheDocument() to expect().
import "@testing-library/jest-dom/vitest";

// Testing Library only cleans up automatically when test functions are global.
// We do not use globals, so we unmount rendered components ourselves.
afterEach(() => {
  cleanup();
});
