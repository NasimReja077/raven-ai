// src/services / email.service.js
import { defaultEmailOptions, transporter } from "../config/mailer.config.js";
import ApiError from "../utils/ApiError.js";
import {
     PASSWORD_RESET_REQUEST_TEMPLATE,
     PASSWORD_RESET_SUCCESS_TEMPLATE,
     VERIFICATION_EMAIL_TEMPLATE,
     WELCOME_EMAIL_TEMPLATE,
} from "../templates/emailTemplates.js";

// Reusable Email Sender Function
export const sendEmail = async (to, subject, htmlContent) => {
     try {
          const mailOptions = {
               ...defaultEmailOptions,
               to,
               subject,
               html: htmlContent,
          };
          const info = await transporter.sendMail(mailOptions);
          console.log(
               `✅ Email sent successfully to ${to} | Message ID: ${info.messageId}`,
          );
          return { success: true, messageId: info.messageId };
     } catch (error) {
          console.error(`❌ Failed to send email to ${to}:`, error);

          // In production, we might want to log the error but not fail the entire request if email sending fails, since it's not critical for the main flow (e.g., user registration)
          if (process.env.NODE_ENV === "production") {
               console.error("Email sending failed but request will continue...");
               return { success: false, error: error.message };
          }

          throw new ApiError(500, `Email sending failed: ${error.message}`);
     }
};

// 1> Email Verification with OTP
export const sendOTPEmail = async (email, username, otp) => {
     try {
          const htmlContent = VERIFICATION_EMAIL_TEMPLATE.replace(
               "{username}",
               username || "User",
          ) // why User? Because in some casses we might not have the username available, so we provide a fallback.
               .replace("{otp}", otp);
          return sendEmail(email, "Verify Email Address", htmlContent);
     } catch (error) {
          console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
          throw error;
     }
};

// 2> Welcome Email

export const sendWelcomeEmail = async (email, username) => {
     try {
          const htmlContent = WELCOME_EMAIL_TEMPLATE.replace(
               "{username}",
               username || "User",
          ).replace("{frontendUrl}", process.env.FRONTEND_URL);

          return sendEmail(email, "Welcome to Raven AI! 🥳", htmlContent);
     } catch (error) {
          console.error(
               `❌ Failed to send welcome email to ${email}:`,
               error.message,
          );
          return { success: false, error: error.message };
          // throw error;
     }
};

// 3> Password Reset Request
export const sendPasswordResetEmail = async (email, resetUrl, username) => {
     try {
          const htmlContent = PASSWORD_RESET_REQUEST_TEMPLATE.replace(
               "{username}",
               username || "User",
          ).replace("{resetUrl}", resetUrl);
          return sendEmail(email, "Password Reset Request 🔑", htmlContent);
     } catch (error) {
          console.error(
               `❌ Failed to send password reset email to ${email}:`,
               error.message,
          );
          throw error;
     }
};

// 4> Password Reset Success
export const sendPasswordResetConfirmation = async (email, username) => {
     try {
          const htmlContent = PASSWORD_RESET_SUCCESS_TEMPLATE.replace(
               "{username}",
               username || "User",
          );
          return sendEmail(email, "Password Reset Successful 🎉", htmlContent);
     } catch (error) {
          console.error(
               `❌ Failed to send password reset confirmation email to ${email}:`,
               error.message,
          );
          return { success: false, error: error.message };
     }
};
