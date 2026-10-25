import type { Plugin } from 'vite';
import { handleApiRequest } from './apiRouter';

export function viteApiPlugin(): Plugin {
  return {
    name: 'nextaura-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const urlObj = new URL(rawUrl, 'http://localhost');
        if (!urlObj.pathname.startsWith('/api')) {
          return next();
        }

        try {
          // Read request body for POST/PUT
          let bodyBuffer = Buffer.from([]);
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
            }
            bodyBuffer = Buffer.concat(chunks);
          }

          // Construct Web Request
          const headers = new Headers();
          for (const [key, val] of Object.entries(req.headers)) {
            if (val) {
              if (Array.isArray(val)) {
                val.forEach((v) => headers.append(key, v));
              } else {
                headers.set(key, val);
              }
            }
          }

          const webReq = new Request(new URL(rawUrl, `http://${req.headers.host || 'localhost:8080'}`).href, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' ? undefined : bodyBuffer,
          });

          const webRes = await handleApiRequest(webReq);

          // Write back to Node response
          res.statusCode = webRes.status;
          webRes.headers.forEach((val, key) => {
            res.setHeader(key, val);
          });

          const arrayBuffer = await webRes.arrayBuffer();
          res.end(Buffer.from(arrayBuffer));
        } catch (err: any) {
          console.error('Error handling API request in dev middleware:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
        }
      });
    },
  };
}
