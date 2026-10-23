import mongoose from 'mongoose';

/**
 * Wedding Schema:
 * Ye schema ShaadiPage me wedding website ke saare details ko store karta hai.
 * Isme user ki ID, dulha-dulhan ka naam (brideName, groomName), shaadi ki date, venue,
 * unki love story, Cloudinary photo URL, AI se generate kiya hua HTML website code,
 * public visibility (isPublic) aur shareable URL slug (shareSlug) save hota hai.
 */
const weddingSchema = new mongoose.Schema(
  {
    // Kis registered user ka ye wedding page hai (User model ke sath relation/reference)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A wedding profile must be associated with a registered user.'],
    },
    // Dulhan ka naam
    brideName: {
      type: String,
      required: [true, 'Please provide the bride name'],
      trim: true,
      maxlength: [100, 'Bride name cannot exceed 100 characters'],
    },
    // Dulhe ka naam
    groomName: {
      type: String,
      required: [true, 'Please provide the groom name'],
      trim: true,
      maxlength: [100, 'Groom name cannot exceed 100 characters'],
    },
    // Shaadi ki date
    weddingDate: {
      type: Date,
      required: [true, 'Please provide the wedding ceremony date'],
    },
    // Shaadi ka venue / location
    venue: {
      type: String,
      required: [true, 'Please provide the wedding venue / location'],
      trim: true,
      maxlength: [200, 'Venue description cannot exceed 200 characters'],
    },
    // Couple ki love story ya extra details
    story: {
      type: String,
      default: '',
      trim: true,
    },
    // Cloudinary pe uploaded photo ka secure URL
    photoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    // Gemini AI dwara generate kiya gaya complete wedding website ka HTML code
    generatedHTML: {
      type: String,
      default: '',
    },
    // Background generation job ka status ('idle' | 'generating' | 'done' | 'failed')
    generationStatus: {
      type: String,
      enum: ['idle', 'generating', 'done', 'failed'],
      default: 'idle',
    },
    // Generation fail hone par frontend ko dikhane wala friendly message
    generationError: {
      type: String,
      default: '',
    },
    // Job start ka timestamp (stale 'generating' detect karne ke liye)
    generationStartedAt: {
      type: Date,
    },
    // Page public hai ya private (default true rahega)
    isPublic: {
      type: Boolean,
      default: true,
    },
    // Unique URL slug jisse koi bhi public link se website access kar sake
    shareSlug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-Validate Hook:
 * Validation se pehle automatically unique shareSlug generate karta hai.
 * Agar user ne khud ka slug nahi diya, toh bride aur groom ke naam ko milakar
 * ek clean aur unique URL slug bana deta hai (jaise: priya-weds-rohan-x9y2z).
 */
weddingSchema.pre('validate', function (next) {
  if (!this.shareSlug && this.brideName && this.groomName) {
    const cleanBride = this.brideName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanGroom = this.groomName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    this.shareSlug = `${cleanBride}-weds-${cleanGroom}-${randomSuffix}`;
  }
  next();
});

const Wedding = mongoose.model('Wedding', weddingSchema);

export default Wedding;
