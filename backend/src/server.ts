// Entry point: connects to the database and starts the HTTP server.

import { createApp } from "./app.js";
import { createPool } from "./db/pool.js";

const pool = createPool();
const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = createApp(pool, corsOrigin);

app.listen(port, () => {
  console.log(`Syvra Fitness API listening on port ${port}`);
});
