import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images: string[];
  isVerifiedBuyer: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
