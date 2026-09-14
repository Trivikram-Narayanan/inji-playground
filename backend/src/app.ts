import express from 'express';
import cors from 'cors';
import flowRoutes from './routes/flows';
import reportRoutes from './routes/reports';
import configRoutes from './routes/config';

function corsOptions(): cors.CorsOptions {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  const allowed = (raw ? raw.split(',').map((o) => o.trim()).filter(Boolean) : ['http://localhost:5173']);
  return {
    origin: allowed,
  };
}

export function createApp() {
  const app = express();
  app.use(cors(corsOptions()));
  app.use(express.json());

  app.use('/api/flows', flowRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/config', configRoutes);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
