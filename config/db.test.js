// Kok Bo Chang, A0273542E
import connectDB from "./connectDB";
import mongoose from "mongoose";

process.env.MONGO_URL = "mongodb://mock-host:27017/testdb"; //env variable is mocked

jest.mock("mongoose", () => ({
    connect: jest.fn(),
}));

// Kok Bo Chang, A0273542E
describe("connectDB", () => {
    let consoleSpy;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    // Kok Bo Chang, A0273542E
    test("is successful when mongoose.connect resolves", async () => {
        mongoose.connect.mockResolvedValueOnce({
            connection: { host: "localhost" },
        });

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("Connected To Mongodb Database localhost")
        );
    });

    // Kok Bo Chang, A0273542E
    test("logs an error when mongoose.connect rejects", async () => {
        const error = new Error("Connection failed");
        mongoose.connect.mockRejectedValueOnce(error);

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("Error in Mongodb Connection failed")
        );
    });
});