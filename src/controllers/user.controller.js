import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty and other like email format,
  // check if user already exists: username or email
  // check for images, check for avatar(required)
  // upload them to cloudinary and check if uploaded successfully
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return response

  // data comes from form or json then we can access the data using req.body
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

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exists.");
  }

  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // console.log("req.files: ", req.files);

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

export { registerUser };
