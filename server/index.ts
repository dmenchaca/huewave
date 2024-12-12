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

// Always trust the reverse proxy in Replit environment
app.enable('trust proxy');
app.set('trust proxy', true);

// Add proxy-aware middleware early in the stack
app.use((req, res, next) => {
  if (req.secure) {
    // Request was via https, so do no special handling
    next();
  } else {
    // Redirect to https
    res.redirect('https://' + req.headers.host + req.url);
  }
});

// Environment-specific configuration
const isProduction = process.env.NODE_ENV === 'production';

// Port configuration standardized for Replit
const DEFAULT_PORT = 8080;
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_PORT;

if (isNaN(PORT)) {
  console.error(`[Server] Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

// Ensure PORT environment variable is set consistently
process.env.PORT = PORT.toString();

// Log port configuration
log(`Server starting in ${isProduction ? 'production' : 'development'} mode`);
log(`Port configured: ${PORT}`);
log(`Trust proxy: ${app.get('trust proxy')}`);

// Enhanced environment logging for debugging
console.log('\n[Environment Configuration]', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  REPL_ID: process.env.REPL_ID,
  REPL_OWNER: process.env.REPL_OWNER,
  REPL_SLUG: process.env.REPL_SLUG,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  platform: process.platform,
  arch: process.arch,
  version: process.version,
  cwd: process.cwd()
});

// Basic middleware with proper ordering
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Add CORS configuration for development
if (!isProduction) {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
}

// Health check endpoint (before any middleware)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    headers: req.headers,
    proxy: app.get('trust proxy')
  });
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

// Main server initialization function
async function startServer() {
  try {
    log('\n[Server] Starting initialization...');
    
    // Global error handlers with proper categorization
    process.on('uncaughtException', (err) => {
      console.error('\n[Uncaught Exception]', new Date().toISOString());
      console.error('Error:', err);
      console.error('Stack:', err.stack);
      console.error('Process info:', {
        pid: process.pid,
        platform: process.platform,
        version: process.version,
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
      });
      // Log error and exit after ensuring logs are flushed
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('\n[Unhandled Rejection]', new Date().toISOString());
      console.error('At:', promise);
      console.error('Reason:', reason);
      if (reason instanceof Error) {
        console.error('Stack:', reason.stack);
      }
      // Log detailed process state
      console.error('Process state:', {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV,
        time: new Date().toISOString(),
        activeHandles: (process as any)._getActiveHandles?.().length,
        activeRequests: (process as any)._getActiveRequests?.().length
      });
    });

    // Monitor event loop for potential issues
    setInterval(() => {
      const used = process.memoryUsage();
      if (used.heapUsed > 500 * 1024 * 1024) { // 500MB
        console.warn('\n[Memory Warning]', new Date().toISOString());
        console.warn('High memory usage detected:', {
          heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(used.rss / 1024 / 1024)}MB`
        });
      }
    }, 30000); // Check every 30 seconds

    // Register shutdown handlers early
    const shutdown = (signal: string) => {
      log(`\n[Server] Received ${signal}, shutting down gracefully...`);
      setTimeout(() => {
        log('[Server] Force closing after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Verify database connection with enhanced retry logic and detailed error reporting
    log('\n[Database] Verifying connection...');
    let retries = 5; // Increased retries for Replit environment
    let connected = false;
    let lastError: Error | null = null;
    
    // Log database configuration (without sensitive data)
    log('[Database] Configuration:', {
      host: process.env.PGHOST || 'default',
      port: process.env.PGPORT || '5432',
      database: process.env.PGDATABASE || 'default',
      ssl: isProduction ? 'enabled' : 'disabled',
      max_connections: 20
    });
    
    while (retries > 0 && !connected) {
      try {
        const result = await db.execute(sql`SELECT 1`);
        if (result) {
          log('[Database] Connection verified successfully');
          connected = true;
          
          // Additional connection pool diagnostics
          const poolStatus = await db.execute(sql`SELECT COUNT(*) as connections FROM pg_stat_activity`);
          log(`[Database] Active connections: ${JSON.stringify(poolStatus)}`);
        }
      } catch (dbError) {
        lastError = dbError as Error;
        retries--;
        console.error('\n[Database Error]', new Date().toISOString());
        console.error('Error:', {
          message: lastError.message,
          stack: lastError.stack,
          retries_remaining: retries
        });
        
        if (retries > 0) {
          const delay = (6 - retries) * 5000; // Exponential backoff
          log(`Retrying database connection in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('[Database] Connection attempts exhausted');
          console.error('Last error:', lastError);
          console.error('Environment:', {
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            NODE_ENV: process.env.NODE_ENV,
            PGHOST: process.env.PGHOST,
            PGPORT: process.env.PGPORT
          });
          throw new Error(`Database connection failed after multiple attempts: ${lastError.message}`);
        }
      }
    }

    if (!connected) {
      throw new Error('Failed to establish database connection after multiple attempts');
    }

    // Setup routes and middleware
    const apiRouter = registerRoutes(app);
    app.use('/api', apiRouter);
    registerStorePaletteRoute(app);

    // Global error handling middleware
    app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });
    
    // Create HTTP server
    const server = createServer(app);

    log(`\n[Server] Configuring server to use port: ${PORT}`);

    // Initialize server with retry mechanism
    const startServerWithRetry = async (retries = 3): Promise<any> => {
      try {
        return new Promise((resolve, reject) => {
          const serverInstance = app.listen(PORT, '0.0.0.0', async () => {
            log('\n[Server] Started successfully');
            log('='.repeat(50));
            log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            log(`Port: ${PORT}`);
            log(`Server URL: ${isProduction ? 
              `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
              `http://0.0.0.0:${PORT}`}`);
            log(`Health Check: /health`);
            log('='.repeat(50));

            const address = serverInstance.address();
            log(`Server listening on: ${typeof address === 'string' ? address : JSON.stringify(address)}`);
            
            resolve(serverInstance);
          });

          serverInstance.on('listening', () => {
            const address = serverInstance.address();
            if (!address) {
              log('Warning: Could not determine server address');
              return;
            }
            if (typeof address === 'string') {
              log(`Server bound to pipe/socket: ${address}`);
            } else {
              log(`Server bound to ${address.address}:${address.port}`);
            }
          });

          // Enhanced error handling for common Replit scenarios
          serverInstance.on('error', (error: NodeJS.ErrnoException) => {
            console.error('\n[Server Error]', new Date().toISOString());
            console.error('Error details:', {
              code: error.code,
              message: error.message,
              stack: error.stack,
              port: PORT,
              pid: process.pid,
              env: process.env.NODE_ENV
            });

            if (error.code === 'EADDRINUSE') {
              log(`Port ${PORT} is already in use. Attempting to close existing connections...`);
              if (retries > 0) {
                serverInstance.close();
                log(`Retrying server start... (${retries} attempts remaining)`);
                setTimeout(() => {
                  startServerWithRetry(retries - 1).then(resolve).catch(reject);
                }, 1000);
                return;
              }
            }
            reject(error);
          });

          // Enhanced error handling for server startup
          serverInstance.on('error', async (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
              log(`Port ${PORT} is already in use. Attempting to close existing connections...`);
              if (retries > 0) {
                serverInstance.close();
                log(`Retrying server start... (${retries} attempts remaining)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                  const newInstance = await startServerWithRetry(retries - 1);
                  resolve(newInstance);
                } catch (retryError) {
                  reject(retryError);
                }
              } else {
                reject(new Error(`Failed to start server after multiple attempts: ${error.message}`));
              }
            } else {
              console.error('\n[Server Error]', new Date().toISOString());
              console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack,
                port: PORT,
                pid: process.pid,
                env: process.env.NODE_ENV
              });
              reject(error);
            }
          });

          // Monitor server health
          serverInstance.on('listening', () => {
            const address = serverInstance.address();
            log(`Server listening on: ${typeof address === 'string' ? address : JSON.stringify(address)}`);
          });

          // Handle server close
          serverInstance.on('close', () => {
            log('Server closed');
          });
        });
      } catch (error) {
        console.error('[Server Start Error]:', error);
        throw error;
      }
    };

    // Setup static file serving based on environment
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    log(`Running in ${isDevelopment ? 'development' : 'production'} mode`);
    
    try {
      if (isDevelopment) {
        log("Setting up Vite development server...");
        await setupVite(app, server);
        log("Vite development server setup complete");
      } else {
        log("Setting up production static file serving...");
        // Try multiple possible build output directories
        const possiblePaths = [
          path.resolve(__dirname, "..", "dist"),
          path.resolve(__dirname, "..", "build"),
          path.resolve(__dirname, "..", "public")
        ];
        
        let distPath = null;
        for (const path of possiblePaths) {
          if (fs.existsSync(path)) {
            distPath = path;
            break;
          }
        }
        
        if (!distPath) {
          log("No build directory found, falling back to Vite development server");
          await setupVite(app, server);
        } else {
          log(`Serving static files from: ${distPath}`);
          // Enhanced static file serving with proper headers
          app.use(express.static(distPath, {
            etag: true,
            lastModified: true,
            maxAge: '1h',
            index: ['index.html'],
            dotfiles: 'ignore',
            fallthrough: true,
            setHeaders: (res, filePath) => {
              if (filePath.endsWith('.html')) {
                // Never cache HTML files
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
              } else if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
                // Cache static assets
                res.setHeader('Cache-Control', 'public, max-age=3600');
              }
            }
          }));
          
          // Enhanced SPA fallback with better error handling
          app.use("*", (req, res, next) => {
            try {
              // Skip API routes
              if (req.originalUrl.startsWith('/api')) {
                return next();
              }
              
              log(`[SPA] Serving index.html for path: ${req.originalUrl}`);
              const indexPath = path.resolve(distPath, "index.html");
              
              if (!fs.existsSync(indexPath)) {
                log(`[Warning] index.html not found at ${indexPath}`);
                return next(new Error('index.html not found'));
              }
              
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.setHeader('Pragma', 'no-cache');
              res.setHeader('Expires', '0');
              res.sendFile(indexPath);
            } catch (error) {
              console.error('[SPA Fallback Error]:', error);
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

    // Start the server
    await startServerWithRetry();
    
  } catch (error) {
    console.error('\n[Server Error]', new Date().toISOString());
    console.error('Failed to start server:', error);
    console.error('Stack trace:', (error as Error).stack);
    console.error('Process state:', {
      env: process.env.NODE_ENV,
      port: PORT,
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('Critical error during server start:', error);
  process.exit(1);
});
