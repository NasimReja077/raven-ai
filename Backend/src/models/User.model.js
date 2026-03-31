// src/models/User.model.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      index: true
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dhw2dz1km/image/upload/v1773001936/user-default_rvulzb.jpg",
    },
    publicId: {
      // For Cloudinary public ID, not the actual image url
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpire: {
      type: Date,
      select: false,
    },
    lastVerificationSentAt: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpire: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// PASSWORD HASHING MIDDLEWARE

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  try {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = Date.now();
  } catch (err) {
    throw err;
  }
});


// PASSWORD COMPARISON METHOD

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
