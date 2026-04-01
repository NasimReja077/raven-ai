import mongoose from "mongoose";

const CollectionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // SaveItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vault', default: null },

    name: {
      type: String,
      required: [true, "Collection name is required"],
      trim: true,
      maxlength: [50, "Collection name cannot exceed 50 characters"],  
    },
    description: {
      type: String,
      maxlength: [100, "Collection description cannot exceed 100 characters"],
      trim: true,
      default: "",
    },
    icon: {
      type: String,
      default: "GoFileDirectoryFill",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    itemCount: {
      type: Number,
      default: 0,
      min: [0, "Item count cannot be negative"],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    //   isPinned: {
    //   type: Boolean,
    //   default: false,
    // },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    // shareSlug: { type: String, default: null, unique: true, sparse: true },
    // shareEnabledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CollectionSchema.index({ user: 1, name: 1 }, { unique: true });

export const Collection = mongoose.model("Collection", CollectionSchema);
