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

// Initialize express application with enhanced logging
const app = express();

// Configure express for proxy environment (Replit)
app.set('trust proxy', true);
app.enable('trust proxy');
app.set('x-powered-by', false);

// Basic middleware with proper ordering
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Add health check endpoint before any other middleware
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    db: 'connected'
  });
});

// Add request timing middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const ms = seconds * 1000 + nanoseconds / 1000000;
    log(`${req.method} ${req.url} ${res.statusCode} - ${ms.toFixed(2)}ms`);
  });
  next();
});

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Add CORS headers for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

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
    const port = Number(process.env.PORT || '8080');
    
    if (isNaN(port)) {
      throw new Error(`Invalid port number: ${process.env.PORT}`);
    }
    
    log(`Configuring server to use port: ${port}`);

    // Handle server-specific errors with graceful shutdown
    server.on('error', (error: NodeJS.ErrnoException) => {
      log(`Server error: ${error.message}`);
      console.error('Server error details:', error);
      
      // Attempt graceful shutdown
      server.close(() => {
        log('Server closed due to error');
        setTimeout(() => process.exit(1), 1000);
      });
    });

    // Setup static file serving based on environment
    // Default to development mode when NODE_ENV is not set
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
    
    try {
      if (isDevelopment) {
        log("Setting up Vite development server...");
        await setupVite(app, server);
        log("Vite development server setup complete");
      } else {
        log("Setting up production static file serving...");
        const distPath = path.resolve(__dirname, "..", "public");
        
        if (!fs.existsSync(distPath)) {
          log("Public directory not found, falling back to Vite development server");
          await setupVite(app, server);
        } else {
          app.use(express.static(distPath, {
            etag: true,
            lastModified: true,
            setHeaders: (res) => {
              res.set('Cache-Control', 'no-cache');
            }
          }));
          
          // Serve index.html for all routes (SPA fallback)
          app.use("*", (_req, res, next) => {
            try {
              res.sendFile(path.resolve(distPath, "index.html"));
            } catch (error) {
              next(error);
            }
          });
          
          log("Production static file serving setup complete");
        }
      }
    } catch (error) {
      log(`Server setup failed: ${(error as Error).message}`);
      log("Attempting to continue with Vite development server...");
      await setupVite(app, server);
    }

    // Start server with enhanced error handling and graceful shutdown
    try {
      const startServer = () => new Promise<void>((resolve, reject) => {
        const serverInstance = server.listen(port, "0.0.0.0", () => {
          log("=".repeat(50));
          log(`Environment: ${process.env.NODE_ENV}`);
          log(`Database connection: Established`);
          log(`Server started successfully on port ${port}`);
          log(`Health check available at: http://0.0.0.0:${port}/health`);
          log("=".repeat(50));
          resolve();
        });

        // Handle server-specific errors
        serverInstance.on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            log(`Error: Port ${port} is already in use`);
          } else {
            log(`Server error: ${err.message}`);
          }
          reject(err);
        });

        // Handle graceful shutdown
        const shutdown = () => {
          log('Received shutdown signal. Closing server...');
          serverInstance.close((err) => {
            if (err) {
              log(`Error during server shutdown: ${err.message}`);
              process.exit(1);
            } else {
              log('Server closed successfully');
              process.exit(0);
            }
          });
        };

        // Listen for shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
      });

      await startServer();
    } catch (error) {
      log(`Failed to start server: ${(error as Error).message}`);
      console.error('Stack trace:', (error as Error).stack);
      
      // Give time for logs to be written before exiting
      setTimeout(() => {
        log('Server initialization failed, shutting down...');
        process.exit(1);
      }, 1000);
    }
  } catch (outerError) {
    log(`Critical error during server setup: ${(outerError as Error).message}`);
    console.error('Stack trace:', (outerError as Error).stack);
    process.exit(1);
  }
})();
