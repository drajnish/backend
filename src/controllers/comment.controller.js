import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Video id required.");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video id format.");
  }

  //   const videoComments = await Comment.find({ video: videoId })
  // Create the aggregation pipeline for finding comments related to the video
  const aggregation = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    }, // Match comments by videoId
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commentedBy",
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
      $unwind: {
        path: "$commentedBy",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        content: 1,
        commentedBy: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    }, // Optionally, you can sort by creation date
  ];

  // Define pagination options
  const options = {
    page: parseInt(page, 1), // Page number
    limit: parseInt(limit, 10), // Limit per page
  };

  // Get paginated comments using aggregatePaginate
  const comments = await Comment.aggregatePaginate(aggregation, options);

  if (comments.totalDocs === 0) {
    return res.status(200).json(new ApiResponse(200, "No comments found."));
  }

  return res
    .status(200)
    .json(new ApiResponse(201, comments, "All comments fetched successfully."));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content) {
    throw new ApiError(400, "Content is required.");
  }

  if (!videoId) {
    throw new ApiError(400, "Video id required.");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video id format.");
  }

  const video = await Video.findOne({ _id: videoId, isPublished: true });

  if (!video) {
    throw new ApiError(400, "Video not found.");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: userId,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong while uploading comment.");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, comment, "Comment added successfully."));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!commentId) {
    throw new ApiError(400, "Comment id is required.");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment id format.");
  }

  if (!content) {
    throw new ApiError(400, "Content required.");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    { _id: commentId, owner: userId },
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(
      400,
      "Either comment not found or You are not authorized to update this comment."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, updatedComment, "Comment updated successfully.")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!commentId) {
    throw new ApiError(400, "Comment id is required.");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid Comment id format.");
  }

  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: userId,
  });

  if (!deletedComment) {
    throw new ApiError(
      401,
      "Either comment not found or you are not authorized to delete this comment."
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "Comment deleted successfully."));
});

export { getVideoComments, addComment, updateComment, deleteComment };
