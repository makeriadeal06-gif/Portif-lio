import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === "production";

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Use custom so we fully manage fallback routing
    });
    app.use(vite.middlewares);
    
    // Explicit SPA fallback for development reload
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      const isHtml = req.headers.accept?.includes("text/html");
      const hasExtension = path.extname(req.path) !== "";

      if (isHtml || !hasExtension) {
        try {
          let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      } else {
        next();
      }
    });
  } else {
    // Serve static files in production
    app.use(express.static(distPath, {
      maxAge: '1y'
    }));
    
    // Support SPA routing - send all non-asset requests to index.html for clientside navigation
    app.get("*", (req, res) => {
      const isHtml = req.headers.accept?.includes("text/html");
      const hasExtension = path.extname(req.path) !== "";
      
      if (isHtml || !hasExtension) {
        console.log(`[Server] Routing to SPA index for: ${req.path}`);
        return res.sendFile(path.join(distPath, 'index.html'));
      }

      console.warn(`[Server] Asset not found: ${req.path}`);
      res.status(404).send('Asset not found');
    });
  }

  // API routes would go here if any

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [Mode: ${isProduction ? 'Production' : 'Development'}]`);
  });
}

startServer();
