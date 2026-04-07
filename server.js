import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import cors from "cors";
import helmet from "helmet";
import { auditRequestMiddleware } from "./middlewares/auditMiddleware.js";

// configure env
dotenv.config();

//database config
connectDB();

const app = express();

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:6060,http://127.0.0.1:6060"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

//middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
      },
    },
    frameguard: { action: "deny" },
    hsts: {
      maxAge: 10000000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
  })
);
app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (!res.getHeader("Access-Control-Allow-Origin")) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0]);
  }
  next();
});
app.use(express.json());
app.use(morgan("dev"));
app.use(auditRequestMiddleware);

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/audit", auditRoutes);

// rest api

app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

const PORT = process.env.PORT || 6060;

const server = app.listen(PORT, () => {
  console.log(
    `Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white
  );
});

server.setTimeout(10000, (socket) => {
  socket.destroy();
});
