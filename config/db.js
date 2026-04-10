import mongoose from "mongoose";
import colors from "colors";

mongoose.plugin((schema) => {
  schema.pre(["find", "findOne", "count", "aggregate"], function () {
    if (typeof this.maxTimeMS === "function") {
      this.maxTimeMS(process.env.MONGO_DEF_MAX_TIME_MS);
      return;
    }

    if (typeof this.option === "function") {
      this.option({ maxTimeMS: process.env.MONGO_DEF_MAX_TIME_MS });
    }
  });
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE,
      waitQueueTimeoutMS: process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS,
    });
    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white
    );
  } catch (error) {
    console.log(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
