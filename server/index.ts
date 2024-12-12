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

// Basic security configuration
app.disable('x-powered-by');

// Configure for Replit's proxy environment
app.set('trust proxy', 1);

// Health check endpoint (before any middleware)
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// Basic middleware with proper ordering
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

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
    // Global error handlers
    process.on('uncaughtException', (err) => {
      console.error('\n[Uncaught Exception]', new Date().toISOString());
      console.error('Error:', err);
      console.error('Stack:', err.stack);
      console.error('Process info:', {
        pid: process.pid,
        platform: process.platform,
        version: process.version,
        memory: process.memoryUsage()
      });
      // Give time for logs to flush
      setTimeout(() => process.exit(1), 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('\n[Unhandled Rejection]', new Date().toISOString());
      console.error('At:', promise);
      console.error('Reason:', reason);
      if (reason instanceof Error) {
        console.error('Stack:', reason.stack);
      }
      // Log additional context
      console.error('Process state:', {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        activeHandles: (process as any)._getActiveHandles?.().length,
        activeRequests: (process as any)._getActiveRequests?.().length
      });
    });

    // Verify database connection with retries
    log('\n[Database] Verifying connection...');
    let retries = 3;
    let connected = false;
    
    while (retries > 0 && !connected) {
      try {
        const result = await db.execute(sql`SELECT 1`);
        if (result) {
          log('[Database] Connection verified successfully');
          connected = true;
        }
      } catch (dbError) {
        retries--;
        console.error('\n[Database Error]', new Date().toISOString());
        console.error('Error:', dbError);
        console.error(`Retries remaining: ${retries}`);
        
        if (retries > 0) {
          log(`Retrying database connection in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          console.error('Database connection attempts exhausted');
          throw new Error(`Database connection failed after multiple attempts: ${(dbError as Error).message}`);
        }
      }
    }

    if (!connected) {
      throw new Error('Failed to establish database connection after multiple attempts');
    }

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
    const port = 8080;
    log(`\n[Server] Configuring server to use port: ${port}`);

    // Handle server-specific errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n[Server Error] Port ${port} is already in use`);
      } else {
        console.error('\n[Server Error]', error);
      }
      // Exit immediately on critical errors
      process.exit(1);
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

    // Start server with enhanced error handling
    try {
      log('\n[Server] Starting server...');
      
      await new Promise<void>((resolve, reject) => {
        // Start the server
        const server = app.listen(port, '0.0.0.0', () => {
          log('\n[Server] Started successfully');
          log('='.repeat(50));
          log(`Environment: ${process.env.NODE_ENV || 'development'}`);
          log(`Port: ${port}`);
          log(`Health Check: http://0.0.0.0:${port}/health`);
          log('='.repeat(50));
          resolve();
        });

        // Handle specific server errors
        server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            log(`Port ${port} is already in use`);
          }
          reject(error);
        });

        // Graceful shutdown handler
        const shutdown = () => {
          log('\n[Server] Shutting down gracefully...');
          server.close(() => {
            log('[Server] Closed successfully');
            process.exit(0);
          });

          // Force exit after 10s
          setTimeout(() => {
            log('[Server] Force closing after timeout');
            process.exit(1);
          }, 10000);
        };

        // Handle shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
      });
    } catch (error) {
      console.error('\n[Server Error]', new Date().toISOString());
      console.error('Failed to start server:', error);
      console.error('Stack trace:', (error as Error).stack);
      process.exit(1);
    }
  } catch (outerError) {
    log(`Critical error during server setup: ${(outerError as Error).message}`);
    console.error('Stack trace:', (outerError as Error).stack);
    process.exit(1);
  }
})();
