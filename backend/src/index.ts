// Must run before any other import - dotenv needs to populate process.env before the
// route/orchestrator/registry import graph below evaluates its module-level env reads
// (ES module imports execute in file order, so this has to come first, not just earlier
// in this file's own body).
import 'dotenv/config';
import { createApp } from './app';
import { initDb } from './db';

const app = createApp();
const port = process.env.PORT || 3000;

initDb().then(() => {
  app.listen(port, () => {
    console.log(`Playground BFF listening on port ${port}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
