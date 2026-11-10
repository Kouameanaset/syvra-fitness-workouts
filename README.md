# Syvra Fitness - Workout Builder

Syvra Fitness is a small full-stack web application to build workouts. A user can browse a catalogue of exercises, create and edit workouts, and add exercises to a workout with a number of sets and repetitions. The front end is a React single-page application, the back end is an Express REST API written with the Repository pattern, and the data lives in a PostgreSQL database hosted on Neon. The database has three tables (`exercises`, `workouts` and the junction table `workout_exercises`) that model a many-to-many relationship. All data in the seed file is fictional.

## Live links

| Item | URL |
|------|-----|
| Website (Vercel) | `<TODO: Vercel URL>` |
| API (Render) | `<TODO: Render URL>` |
| API health check | `<TODO: Render URL>/api/health` |
| Repository (GitHub) | `<TODO: GitHub URL>` |

Note: the API runs on the Render free plan. After 15 minutes without traffic the service sleeps, so the **first request can take about 50 seconds**. If the website shows an error or a long loading state at first, wait and reload.

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Front end | React + Vite + TypeScript, react-router, plain CSS | Fast dev server and build; routing for 4 pages; plain CSS (with CSS variables for the brand colours and light/dark theme) keeps styling easy to explain. |
| Back end | Node.js 20+, Express 5, TypeScript | Express 5 forwards errors thrown in async routes to the error middleware, so routes stay short. TypeScript catches mistakes (wrong field names, missing null checks) at compile time. |
| Database | PostgreSQL on Neon | Relational model fits the data (many-to-many). Neon has a free hosted tier. |
| DB access | `pg` (node-postgres), **no ORM** | The SQL is written by hand and is visible in the repositories. The evaluator and the student can read exactly what runs against the database, and the Repository pattern stays meaningful. Queries are parameterised (`$1`, `$2`) to prevent SQL injection. |
| Tests | Vitest (back end and front end), Testing Library (front end) | Same tool on both sides, fast, works with TypeScript and ES modules out of the box. |
| Hosting | Neon (DB), Render (API), Vercel (front end) | Free tiers, deploy from GitHub. |

## Database

The schema is in [`backend/db/schema.sql`](backend/db/schema.sql) and the fictional data (15 exercises, 5 workouts, 19 exercise-in-workout links) is in [`backend/db/seed.sql`](backend/db/seed.sql). Both are applied by `npm run db:setup` (see "Running locally").

### Entity-relationship diagram

```mermaid
erDiagram
    exercises ||--o{ workout_exercises : "used in"
    workouts  ||--o{ workout_exercises : "contains"

    exercises {
        SERIAL id PK
        VARCHAR_100 name UK "NOT NULL"
        VARCHAR_50 muscle_group "NOT NULL"
        TEXT description "NOT NULL, default empty"
        TIMESTAMPTZ created_at "NOT NULL, default NOW()"
    }

    workouts {
        SERIAL id PK
        VARCHAR_100 name "NOT NULL"
        TEXT description "NOT NULL, default empty"
        TIMESTAMPTZ created_at "NOT NULL, default NOW()"
    }

    workout_exercises {
        SERIAL id PK
        INTEGER workout_id FK "NOT NULL, ON DELETE CASCADE"
        INTEGER exercise_id FK "NOT NULL, ON DELETE CASCADE"
        INTEGER sets "NOT NULL, CHECK sets > 0"
        INTEGER reps "NOT NULL, CHECK reps > 0"
    }
```

`workout_exercises` also carries the composite unique constraint `workout_exercises_unique_pair UNIQUE (workout_id, exercise_id)` (Mermaid cannot draw a composite key) and the index `idx_workout_exercises_exercise_id` on `exercise_id`.

### Design notes

- **Many-to-many with a junction table.** A workout has many exercises and an exercise appears in many workouts (for example "Squat" is in "Leg Day" and "Full Body Basics"). SQL cannot store that directly, so the junction table `workout_exercises` holds one row per pair, with two foreign keys.
- **Data of the relationship.** `sets` and `reps` live in the junction table, not in `exercises`, because "3 sets of 10" only makes sense for one exercise inside one workout.
- **Unique pair.** `UNIQUE (workout_id, exercise_id)` prevents adding the same exercise twice to the same workout. To change sets/reps the API updates the existing row. A duplicate insert makes Postgres raise error `23505`, which the API turns into HTTP 409.
- **CASCADE rules.** Both foreign keys use `ON DELETE CASCADE`: deleting a workout removes its rows in `workout_exercises`; deleting an exercise removes it from every workout that used it. The other side of the pair is never deleted by removing a link.
- **CHECK constraints.** `sets > 0` and `reps > 0` are enforced by the database as a last line of defence, in addition to the API validation.
- **Other constraints.** `exercises.name` is `UNIQUE`; names, muscle group and description are `NOT NULL` (description defaults to an empty string). Workout names are not unique.
- **Index.** The unique pair already indexes lookups by `workout_id`; the extra index on `exercise_id` speeds up "which workouts use this exercise?".
- **Reset.** `schema.sql` starts with `DROP TABLE IF EXISTS ...`, so running it again resets the database.

## Repository pattern

A repository is the single place that knows how to read and write one kind of data. All SQL for a table lives in its repository class. Routes never contain SQL.

```mermaid
flowchart LR
    A[HTTP request] --> B[Route<br/>validate + respond]
    B --> C[Repository<br/>SQL lives here]
    C --> D[(PostgreSQL)]
```

```text
Route  ->  Repository  ->  Queryable (pg.Pool in production, fake in tests)  ->  Database
```

There are three repositories in `backend/src/repositories/`: `ExerciseRepository`, `WorkoutRepository` and `WorkoutExerciseRepository` (the junction table). Excerpt from the real `ExerciseRepository`:

```ts
export class ExerciseRepository {
  // The database is "injected" through the constructor (dependency injection).
  constructor(private readonly db: Queryable) {}

  async findById(id: number): Promise<Exercise | null> {
    const { rows } = await this.db.query<Exercise>(
      "SELECT * FROM exercises WHERE id = $1",
      [id],
    );
    return rows[0] ?? null;
  }
  // findAll, create, update, delete, findWorkouts, findMuscleGroups ...
}
```

And the route that uses it (no SQL, only validation, a repository call and a response):

```ts
router.get("/:id", async (req, res) => {
  const exercise = await exercises.findById(parseId(req.params.id));
  if (!exercise) throw new HttpError(404, "Exercise not found.");
  res.json(exercise);
});
```

**Why it is used here**

- If a query or the database changes, only the repository changes.
- Routes stay small and readable.
- Each class has one responsibility, which makes the code easy to explain and to test.

**Dependency injection and the `Queryable` interface**

`backend/src/db/pool.ts` defines the only thing a repository needs from the database:

```ts
export interface Queryable {
  query<R = any>(text: string, params?: unknown[]):
    Promise<{ rows: R[]; rowCount: number | null }>;
}
```

Repositories depend on this small interface, not on `pg.Pool`. `createApp(db, corsOrigin)` in `app.ts` receives the database as a parameter and builds the repositories from it; `server.ts` passes the real pool. In unit tests, `backend/src/repositories/fakeDb.ts` builds an object with a mocked `query` function that records the SQL and parameters and returns canned rows. The tests therefore run in milliseconds, need no database and no network, and can assert both the returned data and the exact SQL/parameters sent.

## REST API reference

Base path: `/api`. Request and response bodies are JSON. All `id` path parameters must be positive integers.

### Health

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| GET | `/api/health` | none | 200 `{ "status": "ok" }` | none |

### Exercises

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| GET | `/api/exercises` | none (optional query `?muscle_group=Legs`) | 200 array of exercises | none |
| GET | `/api/exercises/muscle-groups` | none | 200 array of allowed muscle groups (static list) | none |
| GET | `/api/exercises/:id` | none | 200 exercise | 400 invalid id, 404 not found |
| GET | `/api/exercises/:id/workouts` | none | 200 array of `{ workout_id, name, sets, reps }` | 400 invalid id, 404 exercise not found |
| POST | `/api/exercises` | `{ name, muscle_group, description? }` | 201 created exercise | 400 validation, 409 name already exists |
| PUT | `/api/exercises/:id` | `{ name, muscle_group, description? }` | 200 updated exercise | 400 validation or invalid id, 404 not found, 409 name already exists |
| DELETE | `/api/exercises/:id` | none | 204 no content | 400 invalid id, 404 not found |

Validation: `name` required, max 100 characters; `muscle_group` required and one of `Legs, Chest, Back, Shoulders, Arms, Core, Full Body`; `description` optional, max 1000 characters.

### Workouts

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| GET | `/api/workouts` | none | 200 array of workouts, each with `exercise_count` | none |
| GET | `/api/workouts/:id` | none | 200 workout plus `exercises: [{ exercise_id, name, muscle_group, sets, reps }]` | 400 invalid id, 404 not found |
| POST | `/api/workouts` | `{ name, description? }` | 201 created workout | 400 validation |
| PUT | `/api/workouts/:id` | `{ name, description? }` | 200 updated workout | 400 validation or invalid id, 404 not found |
| DELETE | `/api/workouts/:id` | none | 204 no content (links are removed by CASCADE) | 400 invalid id, 404 not found |

Validation: `name` required, max 100 characters; `description` optional, max 1000 characters.

### Exercises inside a workout (junction table)

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| POST | `/api/workouts/:id/exercises` | `{ exercise_id, sets, reps }` | 201 `{ workout_id, exercise_id, sets, reps }` | 400 validation, 404 workout or exercise does not exist, 409 exercise already in the workout |
| PUT | `/api/workouts/:id/exercises/:exerciseId` | `{ sets, reps }` | 200 `{ workout_id, exercise_id, sets, reps }` | 400 validation or invalid id, 404 exercise not in this workout |
| DELETE | `/api/workouts/:id/exercises/:exerciseId` | none | 204 no content (the exercise itself is kept) | 400 invalid id, 404 exercise not in this workout |

Validation: `exercise_id`, `sets`, `reps` must be whole numbers between 1 and 1000.

### Error format and status codes

Every error is JSON:

```json
{ "error": "Validation failed.", "fields": { "name": "This field is required." } }
```

`fields` is present only for validation errors (400) and maps a field name to its message, so the front end can show it next to the right input. Other errors contain only `error`.

| Status | Meaning | Examples |
|--------|---------|----------|
| 200 / 201 / 204 | Success / created / deleted | normal operations |
| 400 | Bad request | validation failed, invalid id, invalid JSON body |
| 404 | Not found | unknown id, unknown route, workout or exercise missing when linking (Postgres FK violation `23503`) |
| 409 | Conflict | duplicate exercise name, exercise already in the workout (Postgres unique violation `23505`) |
| 500 | Server error | unexpected failure; logged on the server, details are not sent to the client |

## Project structure

```text
Syvra-fitness-workouts/
├── README.md
├── .gitignore                    # ignores node_modules, .env, dist
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example              # template; copy to .env (never commit .env)
│   ├── db/
│   │   ├── schema.sql            # CREATE TABLE statements (drops first)
│   │   └── seed.sql              # 15 exercises, 5 workouts, links
│   └── src/
│       ├── server.ts             # starts the server (reads env, creates pool)
│       ├── app.ts                # builds the Express app, CORS, error middleware
│       ├── errors.ts             # HttpError (status + message + fields)
│       ├── types.ts              # TypeScript types for rows and inputs
│       ├── validation.ts         # input validation (+ validation.test.ts)
│       ├── db/
│       │   ├── pool.ts           # Queryable interface + createPool()
│       │   └── setup.ts          # `npm run db:setup`
│       ├── routes/
│       │   ├── exercises.ts
│       │   └── workouts.ts
│       └── repositories/
│           ├── ExerciseRepository.ts
│           ├── WorkoutRepository.ts
│           ├── WorkoutExerciseRepository.ts
│           ├── fakeDb.ts         # fake Queryable for tests
│           └── *.test.ts         # repository unit tests
└── frontend/
    ├── package.json
    ├── vercel.json               # SPA rewrite so deep links work
    ├── .env.example              # VITE_API_URL
    └── src/
        ├── api/                  # API client (fetch wrapper) + tests
        ├── hooks/                # useFetch, useTheme custom hooks (+ tests)
        ├── components/           # shared UI and forms (+ tests)
        ├── pages/                # Workouts, WorkoutDetail, Exercises, ExerciseDetail
        ├── App.tsx               # router
        └── main.tsx
```

## Pages (front end)

| Route | Page |
|-------|------|
| `/workouts` | List of workouts, create a workout |
| `/workouts/:id` | Workout details: its exercises with sets/reps, edit, delete, add or remove exercises |
| `/exercises` | Exercise catalogue with muscle-group filter, create an exercise |
| `/exercises/:id` | Exercise details and the workouts that use it |

Custom hooks: `useFetch` (loading, error and data state for API calls) and `useTheme` (light/dark theme). The API base URL comes from `VITE_API_URL`.

## Running locally

Prerequisites: Node.js 20 or newer, npm, and a free Neon account (https://neon.tech).

1. **Create the database.** In Neon, create a project and copy the connection string (Connect button). It looks like `postgresql://USER:PASSWORD@HOST/neondb?sslmode=require`.
2. **Configure the back end.**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `backend/.env`:
   ```text
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
   PORT=3000
   CORS_ORIGIN=http://localhost:5173
   ```
3. **Install, create tables and seed.**
   ```bash
   npm install
   npm run db:setup
   ```
   WARNING: `db:setup` runs `schema.sql`, which **drops** `workout_exercises`, `workouts` and `exercises` and recreates them. All existing data in those tables is erased.
4. **Start the API.**
   ```bash
   npm run dev
   ```
   Check http://localhost:3000/api/health (expected: `{"status":"ok"}`).
5. **Configure and start the front end** (in another terminal).
   ```bash
   cd frontend
   cp .env.example .env     # set VITE_API_URL=http://localhost:3000
   npm install
   npm run dev
   ```
   Open http://localhost:5173.

Never commit `.env` files. They contain the database password. `.gitignore` excludes them; only `.env.example` files (with fake values) are committed.

Other back-end scripts: `npm run build` (compile to `dist/`), `npm start` (run the compiled server), `npm run typecheck`.

## Tests

Run in each folder:

```bash
cd backend  && npm test
cd frontend && npm test
```

| Area | What is covered |
|------|-----------------|
| Back end: repositories | `ExerciseRepository`, `WorkoutRepository` and `WorkoutExerciseRepository` are tested against a **fake database** (`fakeDb.ts`): returned data, `null`/`false` results when nothing is found, and the exact SQL parameters. No real database is needed. |
| Back end: validation | `validation.test.ts`: accepted inputs, required fields, length limits, allowed muscle groups, positive integers for sets/reps/ids. |
| Front end | The `useFetch` hook (loading, success, error states), form validation (error messages next to inputs), and the API client (URL building from `VITE_API_URL`, error handling), using Vitest and Testing Library. |

The routes and the SQL itself (joins, constraints) are not covered by automated tests; they were checked manually against the Neon database.

## Deployment

Order matters: database first, then API, then front end (which needs the API URL), then update CORS on the API.

### 1. Neon (database)

1. Create a Neon project and copy the connection string.
2. From your machine, put it in `backend/.env` as `DATABASE_URL` and run `npm run db:setup` once to create the tables and seed data in the Neon database.

### 2. Render (API)

1. New > **Web Service**, connect the GitHub repository.
2. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance type: Free
3. Environment variables (set in the Render dashboard, never in the repository):
   - `DATABASE_URL` = the Neon connection string
   - `CORS_ORIGIN` = the Vercel URL of the front end (no trailing slash), for example `https://your-app.vercel.app`
   - `PORT` is set by Render automatically.
   - If the build complains about missing type packages, set `NPM_CONFIG_PRODUCTION=false` so dev dependencies (TypeScript, `@types/*`) are installed during the build.
4. After the deploy, open `<Render URL>/api/health`.

Free plan: the service sleeps after about 15 minutes of inactivity; the first request afterwards takes about 50 seconds (cold start).

### 3. Vercel (front end)

1. Import the GitHub repository in Vercel.
2. Settings:
   - Root Directory: `frontend`
   - Framework preset: Vite (build `npm run build`, output `dist`)
3. Environment variable: `VITE_API_URL` = the Render URL (no trailing slash). Vite reads it at build time, so redeploy after changing it.
4. `frontend/vercel.json` contains a rewrite of every path to `/index.html`, so opening or refreshing a deep link such as `/workouts/3` does not return a 404 (react-router handles the route in the browser).
5. Copy the final Vercel URL into the `CORS_ORIGIN` variable on Render and redeploy the API if it changed.
6. Fill in the "Live links" table at the top of this README.

## AI tools used

Claude Code (Anthropic, model Claude Sonnet 5.5) was used to generate and scaffold the code in this repository, including the back end, the database scripts, the tests and this documentation. Sub-agents were used in parallel for the front end and for the documentation. The student reviewed the generated code and can explain how it works, including the schema, the Repository pattern and the tests.

## Requirements checklist

| Requirement | Where it is satisfied |
|-------------|----------------------|
| 3 tables (two entities + junction) | `backend/db/schema.sql`: `exercises`, `workouts`, `workout_exercises` |
| Seed data: about 15 exercises, 5 workouts | `backend/db/seed.sql`: 15 exercises, 5 workouts, 19 links; applied by `npm run db:setup` |
| Full CRUD REST API | `backend/src/routes/exercises.ts`, `workouts.ts`; see "REST API reference" |
| Repository pattern | `backend/src/repositories/*Repository.ts`; see "Repository pattern" |
| Dependency injection / testability | `Queryable` interface in `backend/src/db/pool.ts`; `createApp(db, ...)` in `app.ts` |
| React, responsive UI | `frontend/` (React + Vite + TypeScript, plain CSS) |
| Custom hook | `useFetch` (and `useTheme`) in `frontend/src/hooks/` |
| The 4 pages | `/workouts`, `/workouts/:id`, `/exercises`, `/exercises/:id` |
| Unit tests | `backend`: repositories + validation; `frontend`: hook, form, API client (`npm test`) |
| Deployment | Neon + Render + Vercel; see "Deployment" and "Live links" |
| ERD | Mermaid diagram in the "Database" section |
| Bonus: TypeScript | Both `backend/` and `frontend/` are written in TypeScript |
| Bonus: form validation | Server side: `backend/src/validation.ts` (per-field errors); client side: front-end forms show the messages next to the inputs |
| Bonus: loading and error states | `useFetch` exposes loading and error state used by the pages; the API returns a consistent JSON error shape |
| Bonus: Syvra brand colours | Light and dark themes built from the Syvra website palette (deep navy `#0B3B5E`, turquoise `#6FCFC3`, mint `#A8E8D0`, teal `#0B5C7A`) as CSS variables in `frontend/src/styles.css`; the turquoise text colour is darkened on light backgrounds for contrast |
