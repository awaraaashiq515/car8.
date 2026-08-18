import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter }       from "./routes/auth.routes";
import { ridesRouter }      from "./routes/rides.routes";
import { driverRouter }     from "./routes/driver.routes";
import { driverAuthRouter } from "./routes/driver.auth.routes";
import { boardRouter }      from "./routes/board.routes";
import { unionRouter }      from "./routes/union.routes";
import { adminRouter }      from "./routes/admin.routes";
import { settingsRouter }   from "./routes/settings.routes";
import "./lib/db"; // ensures schema is created on boot

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "cab8-backend" }));
app.use("/auth",        authRouter);
app.use("/rides",       ridesRouter);
app.use("/driver/auth", driverAuthRouter);
app.use("/driver",      driverRouter);
app.use("/board",       boardRouter);
app.use("/union",       unionRouter);
app.use("/api/union",   unionRouter);
app.use("/admin",       adminRouter); // super-admin portal — no public links
app.use("/settings",    settingsRouter);

app.use((req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.path}` }));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Cab8 backend listening on port ${PORT}`);
});
