// Kok Bo Chang, A0273542E
import connectDB from "./db";
import mongoose from "mongoose";

jest.mock("mongoose", () => ({
  connect: jest.fn(),
  plugin: jest.fn(),
}));

// Kok Bo Chang, A0273542E
describe("connectDB", () => {
  const originalMongoEnv = {
    MONGO_URL: process.env.MONGO_URL,
    MONGO_MAX_POOL_SIZE: process.env.MONGO_MAX_POOL_SIZE,
    MONGO_WAIT_QUEUE_TIMEOUT_MS: process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS,
  };

  let consoleSpy;

  beforeEach(() => {
    process.env.MONGO_URL = "mongodb://mock-host:27017/testdb";
    process.env.MONGO_MAX_POOL_SIZE = "10";
    process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS = "5000";

    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.MONGO_URL = originalMongoEnv.MONGO_URL;
    process.env.MONGO_MAX_POOL_SIZE = originalMongoEnv.MONGO_MAX_POOL_SIZE;
    process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS =
      originalMongoEnv.MONGO_WAIT_QUEUE_TIMEOUT_MS;

    consoleSpy.mockRestore();
  });

  // Kok Bo Chang, A0273542E
  test("is successful when mongoose.connect resolves", async () => {
    mongoose.connect.mockResolvedValueOnce({
      connection: { host: "localhost" },
    });

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL, {
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE,
      waitQueueTimeoutMS: process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS,
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Connected To Mongodb Database localhost")
    );
  });

  // Kok Bo Chang, A0273542E
  test("logs an error when mongoose.connect rejects", async () => {
    const error = new Error("Connection failed");
    mongoose.connect.mockRejectedValueOnce(error);

    await connectDB();

    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL, {
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE,
      waitQueueTimeoutMS: process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS,
    });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Error"));
  });
});
