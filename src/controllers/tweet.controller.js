import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const ownerId = req.user?._id;

  if (!ownerId) {
    throw new ApiError(401, "User not authenticated.");
  }

  if (!content) {
    throw new ApiError(400, "Tweet content is required.");
  }

  // using populate method
  const tweet = await Tweet.create({
    content,
    owner: ownerId,
  });

  const createdTweet = await Tweet.findById(tweet._id)
    .populate("owner", "fullName userName avatar")
    .select("content owner createdAt");

  // using aggregation just for practice
  // const createdTweet = await Tweet.aggregate([
  //   {
  //     $match: {
  //       _id: tweet._id,
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       foreignField: "_id",
  //       localField: "owner",
  //       as: "ownerDetail",
  //       pipeline: [
  //         {
  //           $project: {
  //             fullName: 1,
  //             userName: 1,
  //             avatar: 1,
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   {
  //     $addFields: {
  //       ownerDetail: {
  //         $first: "$ownerDetail",
  //       },
  //     },
  //   },
  //   {
  //     $project: {
  //       content: 1,
  //       ownerDetail: 1,
  //       createdAt: 1,
  //     },
  //   },
  // ]);

  if (!createdTweet) {
    throw new ApiError(500, "Something went wrong while posting tweet.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdTweet, "Tweet posted successfully."));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId?.trim()) {
    throw new ApiError(400, "User id is missing.");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id format.");
  }

  const userTweets = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "tweets",
        foreignField: "owner",
        localField: "_id",
        as: "tweets",
        pipeline: [
          {
            $project: {
              content: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        tweets: 1,
        avatar: 1,
      },
    },
  ]);

  if (!userTweets?.length) {
    throw new ApiError(401, "No tweets available.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userTweets[0], "User tweets fetched successfully.")
    );
});

export { createTweet, getUserTweet };
