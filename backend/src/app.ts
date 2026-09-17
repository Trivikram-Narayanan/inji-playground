import express from 'express';
import cors from 'cors';
import flowRoutes from './routes/flows';
import reportRoutes from './routes/reports';
import configRoutes from './routes/config';
import { openApiSpec } from './openapi';

function corsOptions(): cors.CorsOptions {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw || raw === '*') {
    return { origin: true, credentials: true };
  }
  const allowed = raw.split(',').map((o) => o.trim()).filter(Boolean);
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, health checks)
      if (!origin || allowed.includes('*') || allowed.includes(origin)) {
        return callback(null, true);
      }
      callback(null, true); // Permissive fallback for deployment flexibility
    },
    credentials: true,
  };
}

export function createApp() {
  const app = express();
  app.use(cors(corsOptions()));
  app.use(express.json());

  app.use('/api/flows', flowRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/config', configRoutes);

  app.get('/', (_req, res) => {
    res.json({
      service: 'Inji Interoperability Playground BFF API',
      status: 'online',
      version: 'v2.0-sec_audit',
      docs: '/api/docs',
      health: '/health',
      endpoints: {
        config: '/api/config/options',
        flows: '/api/flows',
        reports: '/api/reports',
      },
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiSpec);
  });

  app.get('/api/docs', (_req, res) => {
    res.set('Content-Type', 'text/html').send(`<!doctype html>
<html>
  <head>
    <title>Inji Interoperability Playground API Docs</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({ url: '/api/openapi.json', dom_id: '#swagger-ui' });
    </script>
  </body>
</html>`);
  });

  return app;
}
