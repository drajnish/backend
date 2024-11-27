import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req?.params;
  const userId = req?.user?._id;

  if (!channelId) {
    throw new ApiError(400, "Channel id required.");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id format.");
  }

  const channel = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });

  if (channel) {
    const unsubscribedChannel = await Subscription.deleteOne({
      _id: channel?._id,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          unsubscribedChannel,
          "You are unsubscribed from the channel successfully."
        )
      );
  } else {
    const checkChannel = await User.findById(channelId);

    if (!checkChannel) {
      throw new ApiError(400, "Channel not found.");
    }

    const subscribedChannel = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    const channelUserDetail = await Subscription.findById(subscribedChannel._id)
      .populate("subscriber", "-password -watchHistory")
      .populate("channel", "-password -watchHistory");
    return res
      .status(200)
      .json(
        new ApiResponse(
          201,
          channelUserDetail,
          "You are subscribed to the channel successfully."
        )
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel id required.");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id format.");
  }

  const checkValidChannel = await User.findById(channelId);

  if (!checkValidChannel) {
    throw new ApiError(400, "No channel found.");
  }

  const channelSubscribers = await Subscription.find({
    channel: channelId,
  }).populate("subscriber", "userName");

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        channelSubscribers,
        "Subscribers fetched successfully."
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "subscriber id required.");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid Subscriber id format.");
  }

  const checkValidSubscriber = await User.findById(subscriberId);

  if (!checkValidSubscriber) {
    throw new ApiError(400, "No channel found.");
  }

  const subscribedChannel = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "userName");

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        subscribedChannel,
        "Subscribed Channel fetched successfully."
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
