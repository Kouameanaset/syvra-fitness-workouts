// Custom hook for the light/dark theme. The CSS reads the attribute
// <html data-theme="dark"> to pick its colours (see styles.css).

import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "syvra-theme";

/** Saved choice first, otherwise the operating system preference. */
function getInitialTheme(): Theme {
  // localStorage can throw (private mode, blocked cookies...), so try/catch.
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // ignore: we just fall back to the OS preference
  }
  const prefersDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function useTheme() {
  // Passing a function to useState runs it only once, on the first render.
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Whenever the theme changes: update <html> and remember the choice.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore: the theme still works, it just will not be remembered
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  return { theme, toggleTheme };
}
