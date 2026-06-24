import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./modules/auth/auth.routes.js";

import { requestLogger } from "./middleware/requestLogger.middleware.js";

import { notFoundMiddleware } from "./middleware/notFound.middleware.js";

import { errorMiddleware } from "./middleware/error.middleware.js";
import numbersRoutes from "./modules/numbers/numbers.routes.js";
import simulateRoutes from "./modules/simulate/simulate.routes.js";

export const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json());

app.use(requestLogger);
app.use(
  "/api/numbers",
  numbersRoutes
);
app.use(
  "/api/simulate",
  simulateRoutes
);
app.get(
  "/health",
  (_, res) => {

    res.json({
      status: "ok"
    });
  }
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(notFoundMiddleware);

app.use(errorMiddleware);