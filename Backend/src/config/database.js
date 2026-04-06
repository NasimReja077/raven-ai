import mongoose from "mongoose";

const connectDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const connectionInstance = await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("\n✅ MongoDB connected!");
    console.log(`DB HOST: ${connectionInstance.connection.host}`);

  } catch (error) {
    console.error("❌ MongoDB Connection FAILED:", error.message);
  }
};

export default connectDatabase;