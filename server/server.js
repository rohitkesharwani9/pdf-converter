import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5173;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: port,
    service: 'frontend'
  });
});

// Proxy API calls to backend with extended timeouts
app.use('/convert', createProxyMiddleware({
  target: 'http://backend:5001',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  timeout: 300000, // 5 minutes
  proxyTimeout: 300000 // 5 minutes
}));

app.use('/api', createProxyMiddleware({
  target: 'http://backend:5001',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  timeout: 300000, // 5 minutes
  proxyTimeout: 300000 // 5 minutes
}));

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${port}`);
  console.log(`Proxying API calls to http://backend:5001`);
}); 