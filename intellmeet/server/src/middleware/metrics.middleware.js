import client from 'prom-client';

// Collect default metrics (CPU, Memory, GC, etc.)
client.collectDefaultMetrics({ register: client.register });

// Counter for total requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Histogram for request durations
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10]
});

/**
 * Express middleware to track HTTP latency and throughput.
 */
export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;

    // Get the base route path (e.g. /api/meetings/:id)
    let route = req.baseUrl + (req.route ? req.route.path : '');
    if (!route) {
      route = req.path;
    }

    // Clean up IDs or hashes in the path to keep metrics cardinality low
    route = route
      .replace(/[0-9a-fA-F]{24}/g, ':id') // mongo ID regex
      .replace(/\/[0-9]+/g, '/:id');       // integer ID regex

    const labels = {
      method: req.method,
      route: route,
      status: res.statusCode
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationInSeconds);
  });

  next();
};

/**
 * Handler endpoint exposing metrics for Prometheus scraping.
 */
export const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};
