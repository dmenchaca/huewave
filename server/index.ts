import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, registerStorePaletteRoute } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { db } from "../db";
import { sql } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] ${message}`);
}

// Initialize express application
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable trust proxy for Replit's environment
app.set('trust proxy', 1);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Verify database connection before proceeding
    try {
      const result = await db.execute(sql`SELECT 1`);
      if (result) {
        log("Database connection verified successfully");
      }
    } catch (dbError) {
      log("Failed to connect to database: " + (dbError as Error).message);
      console.error("Database connection error details:", dbError);
      throw new Error("Database connection failed: " + (dbError as Error).message);
    }

    // Global error handlers
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      console.error(err.stack);
      setTimeout(() => process.exit(1), 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Health check endpoint (before any other routes)
    app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        db: 'connected'
      });
    });

    // Setup routes and middleware
    const apiRouter = registerRoutes(app);
    app.use('/api', apiRouter);
    registerStorePaletteRoute(app);

    // Global error handling middleware (before catch-all routes)
    app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });
    
    // Create HTTP server
    const server = createServer(app);

    // Server configuration
    const PORT = process.env.PORT || '8080';
    const port = Number(PORT);
    if (isNaN(port)) {
      throw new Error(`Invalid port number: ${PORT}`);
    }

    // Handle server-specific errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        log(`Error: Port ${port} is already in use`);
      } else {
        log(`Server error: ${error.message}`);
      }
      setTimeout(() => process.exit(1), 1000);
    });

    // Setup static file serving based on environment
    // Default to development mode when NODE_ENV is not set
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      log("Setting up Vite development server...");
      try {
        await setupVite(app, server);
        log("Vite development server setup complete");
      } catch (viteError) {
        log("Failed to setup Vite development server: " + (viteError as Error).message);
        console.error("Vite setup error details:", viteError);
        throw viteError;
      }
    } else {
      log("Setting up production static file serving...");
      const distPath = path.resolve(__dirname, "..", "public");
      try {
        // Verify if the directory exists
        if (!fs.existsSync(distPath)) {
          log(`Warning: Static files directory ${distPath} not found, falling back to Vite development server`);
          await setupVite(app, server);
        } else {
          app.use(express.static(distPath));
          app.use("*", (_req, res) => {
            res.sendFile(path.resolve(distPath, "index.html"));
          });
          log("Production static file serving setup complete");
        }
      } catch (error) {
        log(`Static file serving setup failed: ${(error as Error).message}`);
        // Fall back to Vite development server if static serving fails
        await setupVite(app, server);
      }
    }

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(port, "0.0.0.0", () => {
        log("=".repeat(50));
        log(`Environment: ${process.env.NODE_ENV}`);
        log(`Database connection: Established`);
        log(`Server started successfully on port ${port}`);
        log(`Health check available at: http://0.0.0.0:${port}/health`);
        log("=".repeat(50));
        resolve();
      });
    });
  } catch (error) {
    log(`Failed to start server: ${(error as Error).message}`);
    console.error('Stack trace:', (error as Error).stack);
    setTimeout(() => process.exit(1), 1000);
  }
})();
