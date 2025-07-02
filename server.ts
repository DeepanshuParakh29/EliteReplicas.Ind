import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function createServer() {
  const app = express();

  // Apply middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // In production, serve static files from the client/dist directory
  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'client/dist')));
  } 
  // In development, use Vite's middleware for serving and HMR
  else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Import and use your API routes
  // Example: app.use('/api', apiRouter);

  // All other routes should be handled by the SPA
  app.get('*', (req, res) => {
    if (isProduction) {
      return res.sendFile(path.join(__dirname, 'client/dist/index.html'));
    }
    // In development, Vite will handle serving the HTML
    return res.status(404).send('Not found');
  });

  return app;
}

// Only start the server if this file is run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().then(app => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { createServer };
