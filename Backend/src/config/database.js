import mongoose from "mongoose";

const connectDatabase = async () => {
     try {
        // Extra safety: check if URI exists
        if (!process.env.MONGODB_URI){
            throw new Error("MONGODB_URI is not defined in .env file");
        }
        const connectionInStance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`\n✅ MongoDB connected!`);
        console.log(`DB HOST: ${connectionInStance.connection.host}`);

     } catch (error) {
          console.error("❌ MONGODB Connection FAILED:", error.message);
          process.exit(1)
     }
}
export default connectDatabase