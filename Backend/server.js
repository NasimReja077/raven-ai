// dotenv.config();
import 'dotenv/config'; 
// import dotenv from "dotenv";
import app from "./src/app.js";
import connectDatabase from "./src/config/database.js";
import "./src/config/cloudinary.config.js";


// Connect to database

connectDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode || Port: ${PORT}`);
});
