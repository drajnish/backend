import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Like } from "../models/like.model.js";
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

  // const createdTweet = await Tweet.findById(tweet._id)
  //   .populate("owner", "fullName userName avatar")
  //   .select("content owner createdAt");

  // using aggregation
  const createdTweet = await Tweet.aggregate([
    {
      $match: {
        _id: tweet._id,
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
      $addFields: {
        ownerDetail: {
          $first: "$ownerDetail",
        },
        totalLikes: 0,
      },
    },
    {
      $project: {
        content: 1,
        ownerDetail: 1,
        createdAt: 1,
        totalLikes: 1,
        totalComments: 1,
      },
    },
  ]);

  if (!createdTweet) {
    throw new ApiError(500, "Something went wrong while posting tweet.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdTweet[0], "Tweet posted successfully."));
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
            $lookup: {
              from: "likes",
              foreignField: "tweet",
              localField: "_id",
              as: "likes",
            },
          },
          {
            $addFields: {
              totalLikes: {
                $size: "$likes",
              },
            },
          },
          {
            $project: {
              content: 1,
              totalLikes: 1,
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

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "No tweet selected.");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id format.");
  }

  if (!content) {
    throw new ApiError(400, "Tweet content is missing.");
  }

  // check alternative method of checking if owner and loggedIn user id is same in videoController -> updateVideo
  const userId = await Tweet.findById(tweetId).select("owner");

  // .equals() is method provided by Mongoose's ObjectId.
  // This method allows you to safely compare two ObjectId instances or strings.
  if (!userId?.owner.equals(req.user?._id)) {
    throw new ApiError(401, "Unauthorized request.");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;

  const tweetOwner = await Tweet.findById(tweetId).select("owner");

  // checks if the tweet posted by same user who is loggedin then only he is auhorized to delete the tweet
  if (!tweetOwner && !userId.equals(tweetOwner?.owner)) {
    throw new ApiError(401, "Unauthorized request.");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  await Like.deleteOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (!deletedTweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully."));
});

export { createTweet, getUserTweet, updateTweet, deleteTweet };
