// Static OpenAPI 3.0 description of the BFF's public routes, per docs/05_API_Specification.md.
// Served as JSON at /api/openapi.json and rendered at /api/docs (see app.ts).
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Inji Interoperability Playground BFF',
    version: '1.0.0',
    description:
      'Orchestrator API for simulated and real OpenID4VCI (issuance) and OpenID4VP (presentation/verification) test flows.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/config/options': {
      get: {
        summary: 'Get available issuers, wallets, verifiers, and credential formats',
        responses: { '200': { description: 'Config options' } },
      },
    },
    '/flows': {
      post: {
        summary: 'Start a new test flow',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  issuer: { type: 'string' },
                  wallet: { type: 'string' },
                  verifier: { type: 'string' },
                  format: { type: 'string' },
                  tamperMode: { type: 'boolean' },
                  tamperType: { type: 'string' },
                  mode: { type: 'string', enum: ['real', 'simulated'] },
                },
                required: ['issuer', 'wallet', 'verifier', 'format'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Flow started' },
          '502': { description: 'Upstream sandbox call failed' },
        },
      },
    },
    '/flows/{id}': {
      get: {
        summary: 'Get flow status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Flow status' }, '404': { description: 'Flow not found' } },
      },
    },
    '/flows/{id}/events': {
      get: {
        summary: 'Get all protocol events recorded for a flow',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Event list' } },
      },
    },
    '/flows/{id}/events/stream': {
      get: {
        summary: 'Server-Sent Events stream of live flow updates',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'text/event-stream of {type, data} updates' } },
      },
    },
    '/flows/{id}/advance': {
      post: {
        summary: 'Advance a flow to its next step (presentation + verification)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated flow state' } },
      },
    },
    '/flows/{id}/report': {
      get: {
        summary: 'Get the interoperability report for a completed flow',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Report' }, '404': { description: 'Report not found' } },
      },
    },
    '/reports': {
      get: {
        summary: 'List historical test reports',
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string' } },
          { name: 'outcome', in: 'query', schema: { type: 'string', enum: ['pass', 'fail'] } },
          { name: 'issuer', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Report list' } },
      },
    },
    '/reports/stats': {
      get: {
        summary: 'Get aggregate pass/fail statistics across all reports',
        responses: { '200': { description: 'Stats: totalTests, passed, failed, passRate, mostCommonError' } },
      },
    },
    '/reports/export': {
      get: {
        summary: 'Export all reports as JSON or a Markdown interoperability matrix',
        parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'markdown'] } }],
        responses: { '200': { description: 'application/json or text/markdown depending on ?format' } },
      },
    },
  },
} as const;
