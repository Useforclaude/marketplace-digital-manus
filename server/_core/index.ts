import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripeWebhook";

type Window = { count: number; resetAt: number };
const apiWindows = new Map<string, Window>();

function securityHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  const isProduction = process.env.NODE_ENV === "production";
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (isProduction) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `script-src 'self'${isProduction ? "" : " 'unsafe-eval' 'unsafe-inline'"}`,
    `connect-src 'self' https://manus-analytics.com${isProduction ? "" : " ws: wss:"}`,
    "object-src 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; "));
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  next();
}

function apiRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const subject = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = apiWindows.get(subject);
  const limit = req.method === "GET" ? 240 : 90;
  if (!current || current.resetAt <= now) {
    apiWindows.set(subject, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (current.count >= limit) return res.status(429).json({ error: "มีคำขอมากเกินไป กรุณาลองใหม่ในอีกสักครู่" });
  current.count += 1;
  next();
}

function protectStateChangingOrigins(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return next();
  const host = req.get("host");
  const expectedOrigin = host ? `${req.protocol}://${host}` : "";
  if (origin !== expectedOrigin) return res.status(403).json({ error: "ไม่อนุญาตให้ส่งคำขอข้ามเว็บไซต์" });
  next();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(securityHeaders);
  // Stripe must receive the untouched request body for signature verification.
  app.post("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), handleStripeWebhook);
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "64kb", extended: false }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    apiRateLimit,
    protectStateChangingOrigins,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
