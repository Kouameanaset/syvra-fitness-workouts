// Shown for any URL that no route matches (the path="*" route in App.tsx).

import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>
        <Link to="/workouts" className="btn btn-primary">
          Go to workouts
        </Link>
      </p>
    </section>
  );
}
