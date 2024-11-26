import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 3,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  // get all videos based on query, sort, pagination
  const options = {
    page,
    limit,
  };

  const matchCondition = {
    title: {
      $regex: query,
      $options: "i", //it tells that the check is case-insesitive by default it is case-sensitive
    },
  };

  // this is conditional if not provided userId then it will return all the videos available in db
  if (userId) {
    matchCondition.owner = new mongoose.Types.ObjectId(userId);
  }

  // using mongoose's populate method
  // const allVideos = await Video.find(matchCondition)
  //   .populate("owner", "fullName userName avatar") // Populate publisher data
  //   .populate("likes") // Populate likes
  //   .populate("comments") // Populate comments
  //   .sort({ [sortBy]: sortType === "desc" ? -1 : 1 })
  //   .skip((page - 1) * limit)
  //   .limit(limit);
  /***
   * above code gives error
   * StrictPopulateError: Cannot populate path `likes` because it is not in your schema.
   * Set the `strictPopulate` option to false to override.
   */

  const allVideos = await Video.aggregatePaginate(
    [
      {
        $match: matchCondition,
      },
      {
        $lookup: {
          from: "users",
          foreignField: "_id",
          localField: "owner",
          as: "publisher",
          pipeline: [
            {
              $project: {
                fullName: 1,
                userName: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "likes",
          foreignField: "video",
          localField: "_id",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "comments",
          foreignField: "video",
          localField: "_id",
          as: "comments",
        },
      },
      {
        $addFields: {
          publisher: {
            $first: "$publisher",
          },
          totalLikes: {
            $size: "$likes",
          },
          totalComments: {
            $size: "$comments",
          },
        },
      },
      {
        $sort: { [sortBy]: sortType === "desc" ? -1 : 1 },
      },
    ],
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(201, allVideos, "Videos fetched successfully."));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // get video, upload to cloudinary, create video
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

  // const videoDetail = await Video.findById(createVideo?._id);

  const videoDetail = await Video.aggregate([
    {
      $match: {
        _id: createVideo?._id,
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "ownerDetail",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        ownerDetail: {
          $first: "$ownerDetail",
        },
        totalLikes: 0,
        totalComments: 0,
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        isPublished: 1,
        createdAt: 1,
        views: 1,
        ownerDetail: 1,
        totalLikes: 1,
        totalComments: 1,
      },
    },
  ]);

  if (!videoDetail) {
    throw new ApiError(500, "Something went wrong while uploading the video.");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, videoDetail[0], "Video published successfully.")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //get video by id
  if (!videoId) {
    throw new ApiError(400, "Video id required.");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }

  // const video = await Video.findById(videoId);
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "ownerDetail",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        foreignField: "video",
        localField: "_id",
        as: "comments",
      },
    },
    {
      $addFields: {
        ownerDetail: {
          $first: "$ownerDetail",
        },
        totalLikes: {
          $size: "$likes",
        },
        totalComments: {
          $size: "$comments",
        },
      },
    },
  ]);

  if (!video) {
    throw new ApiError(401, "No video found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, video[0], "Video fetched successfully."));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video id is required.");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }

  const thumbnailLocalPath = req?.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required.");
  }

  // check owner and loggedIn user id ( Alternate method is in tweetController -> updateTweet)
  const ownerThumb = await Video.findOne({
    _id: videoId,
    owner: req?.user?._id,
  }).select("thumbnail");

  if (!ownerThumb) {
    throw new ApiError(401, "You are not authorized to update this video.");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnail) {
    fs.unlinkSync(thumbnailLocalPath);
    throw new ApiError(400, "Thumbnail is required.");
  }

  // const oldThumb = await Video.findById(videoId).select("thumbnail");

  const oldThumbPublicId = await ownerThumb?.thumbnail
    ?.split("/")
    .pop()
    .split(".")[0];

  const updatedThumb = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );

  if (oldThumbPublicId) {
    await deleteFromCloudinary(oldThumbPublicId);
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, updatedThumb, "Thumbnail updated successfully.")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video id required.");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id.");
  }

  const ownerCheck = await Video.findOne({
    _id: videoId,
    owner: req?.user?._id,
  });

  if (!ownerCheck) {
    throw new ApiError(
      404,
      "No video found or you are not authorized to delete this video."
    );
  }

  const deleteVideo = await Video.findByIdAndDelete(videoId);

  const checkLikes = await Like.countDocuments({ video: videoId });
  if (checkLikes) {
    const deleteLikes = await Like.deleteMany({ video: videoId });
  }

  const checkComments = await Comment.countDocuments({ video: videoId });
  if (checkComments) {
    await Comment.deleteMany({ video: videoId });
  }

  const oldVideoPath = await deleteVideo?.videoFile
    ?.split("/")
    ?.pop()
    ?.split(".")[0];

  console.log("oldVideoPath", oldVideoPath);

  const oldThumbPath = await deleteVideo?.thumbnail
    ?.split("/")
    ?.pop()
    ?.split(".")[0];

  if (oldVideoPath) {
    // video not deleted but image deleted when resource_type was set to "auto"
    // when gives resource_type explicitly then it deletes the video as well
    await deleteFromCloudinary(oldVideoPath, "video");
    await deleteFromCloudinary(oldThumbPath, "image");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, deleteVideo, "Video deleted successfully."));
});

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo };
