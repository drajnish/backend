import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (_, res) => {
  // build a healthcheck response that simply returns the OK status as json with a message

  // return res.status(200).json(new ApiResponse(200, null, "API is healthy"));

  // Check database connection status
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";

  if (dbStatus === "connected") {
    return res
      .status(200)
      .json(new ApiResponse(200, { dbStatus }, "API is healthy"));
  } else {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "API is not healthy"));
  }
});

export { healthCheck };
