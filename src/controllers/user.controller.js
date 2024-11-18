import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  /* 
 Steps to follow for user registration:
 
  get user details from frontend
  validation - not empty and other like email format,
  check if user already exists: username or email
  check for images, check for avatar(required)
  upload them to cloudinary and check if uploaded successfully
  create user object - create entry in db
  remove password and refresh token field from response
  check for user creation
   return response
  */

  // when data comes from form or json then we can access the data using req.body
  const { fullName, email, userName, password } = req.body;
  // console.log("req.body: ", req.body);

  // validation
  // if(fullName === "") {
  //   throw new ApiError(400, "Full Name is required.")
  // }

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  // check if user already exists: username or email
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  // console.log("existed User: ", existedUser);

  // check for images, check for avatar
  const avatarLocalPath = req?.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
  //in below approach if coverImage is not uploaded then it will give TypeError: Cannot read properties of undefined
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  // let coverImageLocalPath;

  // if (
  //   req.files &&
  //   Array.isArray(req.files.coverImage) &&
  //   req.files.coverImage.length > 0
  // ) {
  //   coverImageLocalPath = req.files.coverImage[0].path;
  // }
  // console.log("req.files: ", req.files);

  // delete images from local if user is already registered
  if (existedUser) {
    if (avatarLocalPath) {
      fs.unlinkSync(avatarLocalPath);
    }
    if (coverImageLocalPath) {
      fs.unlinkSync(coverImageLocalPath);
    }
    throw new ApiError(409, "User with username or email already exists.");
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  // upload them to cloudinary and check if uploaded successfully
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // console.log("avatar: ", avatar);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  // console.log("user.create: ", user.toObject(), user.toJSON());

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while register the user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  /**
   * Steps for login
   *
   * req.body => data
   * username or email
   * find the user
   * password check
   * access token and refresh token
   * send cookie
   */

  const { userName, email, password } = req.body;
  // console.log(req.body);

  if (!(userName || email)) {
    throw new ApiError(400, "username or email is required.");
  }

  /** alternate code of above code
   *  if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
   */

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exists.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  /**
   * steps for logout
   *
   * get user detail
   * clear cookies
   * discard refresh token and access token and remove from database
   *
   */
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //this removes the field from document
      },
    },
    {
      // will get new updated value in return
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request.");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token.");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used.");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    // if we try to destructure directly newRefreshToken it will respond as undefined
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token.");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password.");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully."));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required.");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully."));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing.");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar.");
  }

  // TODO: Create a utility to delete lold avatar image from cloudinary
  const oldAvatar = await User.findById(req.user?._id).select("avatar");

  const oldAvatarPublicId = await oldAvatar?.avatar
    ?.split("/")
    ?.pop()
    ?.split(".")[0];

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (oldAvatarPublicId) {
    await deleteFromCloudinary(oldAvatarPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing.");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading cover image.");
  }

  // TODO: Create a utility to delete old cover image from cloudinary
  const oldCoverImage = await User.findById(req.user?._id).select("coverImage");
  const oldCoverImagePublicId = await oldCoverImage?.coverImage
    ?.split("/")
    ?.pop()
    ?.split(".")[0];

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (oldCoverImagePublicId) {
    await deleteFromCloudinary(oldCoverImagePublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully."));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  // console.log(username);

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing.");
  }

  // aggregate returns data in the form of an array and can have multiple object
  const channel = await User.aggregate([
    {
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      // This combines all documents from one collection(user) with matching documents from the other collection(subscriptions).
      $lookup: {
        from: "subscriptions",
        foreignField: "channel",
        localField: "_id",
        as: "subscribers", //adds a field named subscribers in user document
      },
    },
    {
      $lookup: {
        from: "subcriptions",
        foreignField: "subscriber",
        localField: "_id",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", // because new field returns an array so we need size of the field
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          // $cond requires 3 parameters (if, then, else)
          $cond: {
            // $in : [whatToCheck, whereToCheck] , it can check in array and object as well
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // it will project selected values which are defined
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  // console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exists.");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully.")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // req.user?._id -> it will return a string and not the mongodbId
  // to convert this string to mongodbId we need to use ObjectId('string')
  // but we use mongoose which converts string to id bechind the scene
  const user = await User.aggregate([
    {
      $match: {
        // here we need to convert string into mongodbId because in aggregation every thing goes as it is
        // mongoose didn't convert it behind the scene
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        foreignField: "_id", //"<field-in-from-collection>", source is videos in this case,
        localField: "watchHistory", //"<field-in-source-messages>", source is user in this case,
        as: "watchHistory", //"<output-array-field>", name anything you want
        // Specifies the pipeline to run on the joined collection.
        pipeline: [
          // here we are inside the video field
          {
            $lookup: {
              from: "users",
              foreignField: "_id",
              localField: "owner",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
                // The $addFields stage is equivalent to a $project stage
                // that explicitly specifies all existing fields in the input documents and adds the new fields.
              ],
            },
          },
          {
            $addFields: {
              //Adds new fields to documents.
              owner: {
                $first: "$owner", //here owner is a field and $first will returns the first element from owner array.
                // $arrayElemAt: ["$owner", 0] // alternate to above line
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory),
      "Watch history fetched successfully."
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
