// The route table: which component is shown for which URL.

import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ExerciseDetailPage } from "./pages/ExerciseDetailPage";
import { ExercisesPage } from "./pages/ExercisesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { WorkoutDetailPage } from "./pages/WorkoutDetailPage";
import { WorkoutsPage } from "./pages/WorkoutsPage";

export function App() {
  return (
    <Routes>
      {/* Layout (header) wraps every page below it; each page appears in its <Outlet /> */}
      <Route element={<Layout />}>
        {/* "/" goes to the workouts page. "replace" avoids a useless back-button entry. */}
        <Route path="/" element={<Navigate to="/workouts" replace />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
        {/* "*" matches everything else */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
