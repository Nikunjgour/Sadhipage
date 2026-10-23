import mongoose from 'mongoose';

/**
 * RSVP Schema:
 * Ye schema public wedding page se guests dwara submit kiye gaye RSVP responses ko store karta hai.
 * Isme wedding ID, shareSlug, guest ka naam, attendance status, guest count aur timestamp save hota hai.
 */
const rsvpSchema = new mongoose.Schema(
  {
    wedding: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wedding',
      required: [true, 'RSVP must be linked to a wedding'],
    },
    weddingSlug: {
      type: String,
      required: [true, 'Wedding slug is required'],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    attending: {
      type: String,
      enum: ['yes', 'no', 'attending', 'declined'],
      default: 'yes',
      required: true,
    },
    guestCount: {
      type: Number,
      default: 1,
      min: [0, 'Guest count cannot be negative'],
      max: [50, 'Guest count cannot exceed 50'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for fast lookups by wedding or slug
rsvpSchema.index({ wedding: 1, createdAt: -1 });
rsvpSchema.index({ weddingSlug: 1, createdAt: -1 });

const Rsvp = mongoose.model('Rsvp', rsvpSchema);

export default Rsvp;
