import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req?.body;
  const userId = req?.user?._id;

  //create playlist
  if ([name, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Name and description required.");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id format.");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
  });

  const createdPlaylist = await Playlist.findOne({ _id: playlist._id });

  if (!createPlaylist) {
    throw new ApiError(500, "Something went wrong while creating playlist.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, createdPlaylist, "Playlist created successfully.")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user._id;

  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist id and video id is required.");
  }

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Id format should be valid.");
  }

  const findPlayList = await Playlist.findOne({
    _id: playlistId,
    owner: userId,
  });

  if (!findPlayList) {
    throw new ApiError(
      400,
      "Either playlist not found or you are not authorized to add video to this playlist."
    );
  }

  if (findPlayList.videos.includes(videoId)) {
    return res.status(200).json(new ApiResponse(201, "Video already added."));
  }

  const findVideoId = await Video.findById(videoId);

  if (!findVideoId) {
    throw new ApiError(400, "Video not found.");
  }

  const addVideo = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    {
      $push: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!addVideo) {
    throw new ApiError(500, "Something went wrong while updating playlist.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, addVideo, "Video added to playlist successfully.")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // remove video from playlist

  if (!playlistId || !videoId) {
    throw new ApiError(400, "Playlist id and video id is required.");
  }

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Id format should be valid.");
  }

  const findVideo = await Playlist.findById(playlistId);

  if (!findVideo.videos.includes(videoId)) {
    throw new ApiError(400, "No video found in playlist.");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatePlaylist) {
    throw new ApiError(
      500,
      "Something went wrong while removing video from playlist."
    );
  }

  const updatedPlaylist = await Playlist.findById(playlistId).select("videos");

  return res
    .status(200)
    .json(new ApiResponse(201, updatePlaylist, "Video removed successfully."));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user._id;

  //delete playlist
  if (!playlistId) {
    throw new ApiError(400, "Playlist id and video id is required.");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Id format should be valid.");
  }

  const findPlayList = await Playlist.findOne({
    _id: playlistId,
    owner: userId,
  });

  if (!findPlayList) {
    throw new ApiError(
      400,
      "Either playlist not found or you are not authorized to delete this playlist."
    );
  }

  const deleteList = await Playlist.findByIdAndDelete(playlistId);

  if (!deleteList) {
    throw new ApiError(500, "Something went wrong while deleting playlist.");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, "Playlist deleted successfully."));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const userId = req.user._id;

  //update playlist
  if (!playlistId) {
    throw new ApiError(400, "No playlist selected");
  }

  if (!name || !description) {
    throw new ApiError(400, "Name and description required.");
  }

  // * commented the code for optimization suggested by chatGPT
  /**
  const playlist = await Playlist.findOne({ _id: playlistId, owner: userId });

  if (!playlist) {
    throw new ApiError(
      400,
      "Either playlist not available or you are not authorized to update this playlist."
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );
  **/

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(
      400,
      "Either playlist not found or you are not authorized to update it."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, updatedPlaylist, "Playlist updated successfully.")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "user id is required.");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id format.");
  }

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
      },
    },

    // * no need to send owners detail
    /**
    {
        $lookup: {
            from: "videos",
            foreignField: "_id",
            localField: "videos",
            as: "playlistVideoDetails",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "owner",
                        as: "ownerDetail"
                    }
                },
                {
                    $project: {
                        fullName: 1,
                        userName: 1,
                        avatar: 1,
                    }
                }
            ]
        }
    },
    {
        $unwind: { // ? Unwind the `videoDetails` array to get a single video object per playlist entry
            path: "$playlistVideoDetails",
            preserveNullAndEmptyArrays: true,  // In case there are no videos in the playlist
        }
    },
    {
        $project: {  // Optionally, project specific fields you need
          name: 1,
          description: 1,
          owner: 1,
          playlistVideoDetails: {   // Include video details and select necessary fields
            _id: 1,
            title: 1,
            videoFile: 1,
            thumbnail: 1,
            owner: 1,
          },
        },
    }
    */
  ]);

  if (!userPlaylists) {
    throw new ApiError(
      500,
      "Something went wrong while fetching users playlist."
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(201, userPlaylists, "Playlists fetched successfully.")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId) {
    throw new ApiError(400, "Playlist id required.");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id format.");
  }

  /**
  const playlist = await Playlist.findById(playlistId)
    .populate("owner", "userName fullName avatar")
    .populate({
      path: "videos",
      model: "Video",
      select: "-isPublished -description",
      populate: {
        path: "owner",
        model: "User",
        select: "fullName userName avatar",
      },
    });
     */

  const playlist = await Playlist.aggregate([
    // Match the playlist by its ID
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    // Lookup the owner of the playlist
    {
      $lookup: {
        from: "users", // The collection to join (users collection)
        localField: "owner", // The field in the Playlist document
        foreignField: "_id", // The field in the Users collection
        as: "owner", // Output field name
      },
    },
    // Unwind the owner array (because it's an array of one object, we need to deconstruct it)
    {
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true, // In case there's no owner
      },
    },
    // Lookup for the videos array and populate the video details
    {
      $lookup: {
        from: "videos", // The collection to join (videos collection)
        localField: "videos", // The field in the Playlist document (videos is an array of video IDs)
        foreignField: "_id", // The field in the Videos collection
        as: "videos", // Output field name
        pipeline: [
          // Lookup for the owner of each video
          {
            $lookup: {
              from: "users", // The collection to join (users collection)
              localField: "owner", // The 'owner' field inside each video
              foreignField: "_id", // The field in the Users collection
              as: "videoOwner", // Output field name for each video's owner
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
              path: "$videoOwner",
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    },

    // Optionally, we can project to remove any unnecessary fields (like password) from the response
    {
      $project: {
        name: 1,
        description: 1,
        "owner.userName": 1,
        "owner.fullName": 1,
        "owner.avatar": 1,
        videos: {
          title: 1,
          videoFile: 1,
          thumbnail: 1,
          videoOwner: 1,
        },
      },
    },
  ]);

  if (!playlist) {
    throw new ApiError(401, "No Playlist found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, playlist, "Playlist fetched successfully."));
});

export {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getUserPlaylists,
  getPlaylistById,
};
