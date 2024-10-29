// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { PORT_NUMBER } from "./constants.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error: ", (err) => {
      console.log("Error: ", err);
      throw err;
    });

    app.listen(PORT_NUMBER, () => {
      console.log(`Server is running at port: ${PORT_NUMBER}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed!! ", err);
  });

/*
import express from "express";

const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error: ", (error) => {
      console.log("Error: ", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`app is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
})();
*/
