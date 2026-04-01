import mongoose from "mongoose";

const TagSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      lowercase: true,
      maxlength: [50, 'Tag name cannot exceed 50 characters'],
    },
    color: { 
      type: String, 
      default: "#7555f8",
      validate: {
        validator: (v) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v),
        message: 'color must be a valid hex value (e.g. #fff or #aabbcc)',
      },
    },
    isAiGenerated: { 
      type: Boolean, 
      default: false 
    },
    usageCount: { 
      type: Number, 
      default: 0 
    },
    // Soft-delete
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

TagSchema.index({ user: 1, name: 1 }, { unique: true });
TagSchema.index({ user: 1, isArchived: 1 });

export default mongoose.model("Tag", TagSchema);
