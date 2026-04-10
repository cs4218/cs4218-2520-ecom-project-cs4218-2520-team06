import mongoose from "mongoose";
import colors from "colors";

const GLOBAL_MONGO_MAX_TIME_MS = 8000;
const MONGO_WAIT_QUEUE_TIMEOUT_MS = 8000;

mongoose.plugin((schema) => {
  schema.pre(["find", "findOne", "count", "aggregate"], function () {
    if (typeof this.maxTimeMS === "function") {
      this.maxTimeMS(GLOBAL_MONGO_MAX_TIME_MS);
      return;
    }

    if (typeof this.option === "function") {
      this.option({ maxTimeMS: GLOBAL_MONGO_MAX_TIME_MS });
    }
  });
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: 400,
      waitQueueTimeoutMS: MONGO_WAIT_QUEUE_TIMEOUT_MS,
    });
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white
    );
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
