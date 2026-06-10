import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';

import { auth } from './lib/auth.js';
import { isAllowedOrigin } from './lib/origins.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';

import userRoutes from './routes/user.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import budgetPlanRoutes from './routes/budget-plan.routes.js';
import mealPlanRoutes from './routes/meal-plan.routes.js';
import mealTypeRoutes from './routes/meal-type.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const port = Number(process.env.API_PORT) || 3001;
const baseUrl = process.env.API_URL || `http://localhost:${port}`;

// Trust exactly the number of proxy hops in front of us (1 on Render, 0 local)
// so `req.ip` — which the rate limiter keys on — is the real client, not the
// proxy. Never `true`: it trusts the spoofable client-supplied part of the chain.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 0);

app.use(
  cors({
    origin(origin, callback) {
      // Server-to-server requests (no Origin header) — e.g. the scraper.
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  }),
);

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Application routes only. `/api/auth/*` is handled above by better-auth (which
// has its own rate limiting), and `/health` stays unthrottled for Render pings.
app.use('/api', apiRateLimiter);

app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/budget-plans', budgetPlanRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/meal-types', mealTypeRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`
🚀 API Server started
━━━━━━━━━━━━━━━━━━━━━━━━━━
Environment : ${process.env.NODE_ENV || 'development'}
API URL     : ${baseUrl}
Health      : ${baseUrl}/health
Auth        : ${baseUrl}/api/auth
━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});
