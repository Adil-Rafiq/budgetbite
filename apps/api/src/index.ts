import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';

import { auth } from './lib/auth.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import userRoutes from './routes/user.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import budgetRoutes from './routes/budget.routes.js';
import mealRoutes from './routes/meal.routes.js';
import orderRoutes from './routes/order.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();
const port = Number(process.env.API_PORT) || 3001;
const baseUrl = process.env.API_URL || `http://localhost:${port}`;

app.use(
  cors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/orders', orderRoutes);
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
