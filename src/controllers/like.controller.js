import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req?.user?._id;
  //toggle like on video

  if (!videoId) {
    throw new ApiError(400, "Video id required.");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }

  if (!userId) {
    throw new ApiError(401, "You need to login first to like this video.");
  }

  const videoExists = await Video.findOne({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(400, "Video not found.");
  }

  const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike?._id });

    return res
      .status(200)
      .json(new ApiResponse(201, "Like removed successfully."));
  } else {
    const like = await Like.create({
      video: videoId,
      likedBy: req?.user?._id,
    });

    if (!like) {
      throw new ApiError(500, "Something went wrong while like the video.");
    }

    return res
      .status(200)
      .json(new ApiResponse(201, like[0], "Video liked successfully."));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;

  if (!commentId) {
    throw new ApiError(400, "Tweet id is missing.");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid tweet id format.");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id format.");
  }

  const existingCommentLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (!existingCommentLike) {
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });

    return res
      .status(200)
      .json(new ApiResponse(201, "Comment liked successfully."));
  } else {
    await Like.findByIdAndDelete(existingCommentLike._id);

    return res
      .status(200)
      .json(new ApiResponse(201, "Comment like removed successfully."));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  if (!tweetId) {
    throw new ApiError(400, "Tweet id is missing.");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id format.");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id format.");
  }

  const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

  if (existingLike) {
    await Like.deleteOne({ _id: existingLike._id });

    return res
      .status(200)
      .json(new ApiResponse(200, "Like removed successfully."));
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });

    return res.status(200).json(new ApiResponse(200, "Tweet liked."));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //get all liked videos
  const userId = req?.user?._id;

  if (!userId) {
    throw new ApiError(400, "User id is required.");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User id format.");
  }

  const likedVideos = await Like.find({
    likedBy: userId,
  });

  if (!likedVideos) {
    throw new ApiError(400, "No videos liked.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        likedVideos,
        "All Liked videos fetched successfully."
      )
    );
});

export { toggleTweetLike, toggleCommentLike, toggleVideoLike, getLikedVideos };
