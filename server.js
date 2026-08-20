import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import apiRouter from "./backend/routes/api.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON bodies with higher limits for base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Register modular backend API router
app.use("/api", apiRouter);

// NODE SERVING (Vite + Dist Static Files)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Mount Vite's HMR middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve static files from compiled dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MyNeighbourhood] Full-stack Server successfully initialized.`);
    console.log(`Port binding: Host 0.0.0.0 on port ${PORT}`);
    console.log(`Live developer environment ready.`);
  });
}

startServer();
