import "dotenv/config";
import cors from "cors";
import express from "express";

import { errorMiddleware } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import mealRoutes from "./routes/meal.routes.js";
import orderRoutes from "./routes/order.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

const app = express();
const port = Number(process.env.API_PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
});
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`BudgetBite API listening on http://localhost:${port}`);
});
