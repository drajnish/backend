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
/**
 * express.static is a built-in middleware function in Express that serves static files,
 * such as HTML files, CSS stylesheets, JavaScript files, images, and other assets.
 * When you pass "public" to express.static(),
 * Express will serve files from the public directory relative to your project's root directory.
 */
app.use(express.static("public"));
// to perform crud operation in cookies
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.route.js";
import tweetRouter from "./routes/tweet.route.js";
import likeRouter from "./routes/like.route.js";
import videoRouter from "./routes/video.route.js";
import subscriptionRouter from "./routes/subscription.route.js";
import playlistRouter from "./routes/playlist.route.js";

// routes declaration
// here we cannot use app.get() because we seperate the routes and controllers so we need middleware
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/playlist", playlistRouter);

// http://localhost:8000/api/v1/users/register
export { app };
