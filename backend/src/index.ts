import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config/index.js";
import { connectDB } from "./database/index.js";
import middleware from "./middleware/index.js";
import routes from "./routers/index.js";

const app = express();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(middleware.cors);

// Static file serving for uploaded PDFs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// API Routes
app.use("/api", routes);

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "PMC Backend API is running" });
});

// Start Server
const PORT = config.HOST_API_PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
