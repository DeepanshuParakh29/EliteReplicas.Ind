import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { handler as ssrHandler } from './dist/server/entry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function createServer() {
  const app = express();
  
  // In production, serve static files from the client/dist directory
  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'client/dist'), {
      index: false,
    }));
  } 
  // In development, use Vite's middleware for serving and HMR
  else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  }

  // API routes would go here
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // All other routes should be handled by the SPA
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    if (isProduction) {
      return res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    }
    
    // In development, defer to Vite's HTML fallback
    next();
  });

  // In production, use the SSR handler
  if (isProduction) {
    app.use(ssrHandler);
  }

  return app;
}

// Only start the server if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().then(app => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export { createServer };
