import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  getUserPlaylists,
  getPlaylistById,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);

router.route("/:playlistId").patch(updatePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);

router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/:playlistId").delete(deletePlaylist);

router.route("/user/:userId").get(getUserPlaylists);

router.route("/:playlistId").get(getPlaylistById);

export default router;
