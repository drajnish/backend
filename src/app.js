import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// read about json options in express documentation
app.use(express.json({ limit: "16kb" }));
// configuration for url encoding
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// to store public files and folders
app.use(express.static("public"));
// to perform crud operation in cookies
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.route.js";

// routes declaration
app.use("/api/v1/users", userRouter);

export { app };
