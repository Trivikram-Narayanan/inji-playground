import dotenv from 'dotenv';
import { createApp } from './app';
import { initDb } from './db';

dotenv.config();

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
