import { Router } from "express";
import { toggleTweetLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);

export default router;
