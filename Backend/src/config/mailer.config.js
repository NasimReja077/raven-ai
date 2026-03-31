// src/config/mailer.config.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
     host: "smtp.gmail.com",
     port: 587,
     secure: false, // true for 465, false for other ports
     auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
     },
});

// Verify connection configuration
export const emailAppConnection = async () =>{
     try {
          await transporter.verify();
          console.log("✅ Email server (SMTP) is ready to send messages")
          return true;
     } catch (error) {
          console.error("❌ Email server connection failed:",error);
          return false;
     }
};

// Default email options 
export const defaultEmailOptions = {
     from: {
          name: process.env.EMAIL_FROM_TEAM_NAME || "Raven AI Team",
          address: process.env.EMAIL_USER,
     },
};