import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

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
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(distPath, {
      maxAge: '1y',
      index: false
    }));
    
    // Support SPA routing - send all non-found requests to index.html for clientside navigation
    // But ONLY if they don't look like file requests (contain a dot in the last segment)
    app.get("*", (req, res) => {
      const isFileRequest = req.path.split('/').pop()?.includes('.');
      
      if (isFileRequest) {
        console.warn(`[Server] Missing asset: ${req.path}`);
        return res.status(404).send('Asset not found');
      }

      console.log(`[Server] Routing to SPA index for: ${req.path}`);
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // API routes would go here if any

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [Mode: ${isProduction ? 'Production' : 'Development'}]`);
  });
}

startServer();
