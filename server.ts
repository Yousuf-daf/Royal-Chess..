import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

// In production, server.mjs resides in dist/, so static assets are in __dirname
const distDir = __dirname.endsWith('dist') ? __dirname : path.resolve(__dirname, 'dist');

app.disable('x-powered-by');

// Security headers suitable for public web deployment
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Health check endpoint for Google Cloud Run / load balancers
app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Serve static production assets with correct WASM MIME type & caching
app.use(
  express.static(distDir, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
      if (filePath.includes(`${path.sep}assets${path.sep}`) || filePath.includes(`${path.sep}stockfish${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    },
  })
);

// SPA fallback for direct page loads (/play, /settings, /how-to-play, /about)
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Royal Chess server listening on port ${port}`);
});
