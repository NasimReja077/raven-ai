import 'dotenv/config';

import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";
import "./src/config/cloudinary.config.js";
import "./src/workers/processItem.worker.js";

console.log("🚀 SERVER STARTING...");

const startServer = async () => {
  try {
    await connectDatabase();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`✅ Ravin AI running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ SERVER START ERROR:", error.message);
  }
};

startServer();