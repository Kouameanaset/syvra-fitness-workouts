// The frame shared by every page: header (logo, nav, theme button) + content.

import { Link, NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

export function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Lets keyboard users jump over the navigation. */}
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="site-header">
        <div className="container header-inner">
          <Link to="/workouts" className="logo">
            SYVRA <span>Fitness</span>
          </Link>

          <nav aria-label="Main" className="nav">
            {/* NavLink adds the class "active" to the link of the current page. */}
            <NavLink to="/workouts">Workouts</NavLink>
            <NavLink to="/exercises">Exercises</NavLink>
          </nav>

          {/* The button shows the theme you would switch TO, like the Syvra site. */}
          <button type="button" className="btn btn-secondary theme-toggle" onClick={toggleTheme}>
            {theme === "light" ? "Dark" : "Light"}
          </button>
        </div>
      </header>

      <main id="main" className="container">
        {/* Outlet = the place where the page of the current route is drawn. */}
        <Outlet />
      </main>
    </>
  );
}
