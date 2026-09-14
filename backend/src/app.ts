import express from 'express';
import cors from 'cors';
import flowRoutes from './routes/flows';
import reportRoutes from './routes/reports';
import configRoutes from './routes/config';
import { openApiSpec } from './openapi';

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
