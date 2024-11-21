import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw new ApiError(404, "title and description are required.");
  }

  const videoFileLocalPath = req?.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required.");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required.");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!thumbnail) {
    fs.unlinkSync(thumbnailLocalPath);
    throw new ApiError(400, "Thumbnail is required.");
  }

  if (!videoFile) {
    fs.unlinkSync(videoFileLocalPath);
    throw new ApiError(400, "Video file is required.");
  }

  const createVideo = await Video.create({
    title,
    description,
    videoFile: videoFile?.url,
    thumbnail: thumbnail?.url,
    owner: req?.user?._id,
    duration: videoFile?.duration,
  });

  const videoDetail = await Video.findById(createVideo?._id).select("-owner");

  if (!videoDetail) {
    throw new ApiError(500, "Something went wrong while uploading the video.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, videoDetail, "Video published successfully."));
});

export { getAllVideos, publishAVideo };
