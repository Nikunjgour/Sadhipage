import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema:
 * Ye schema database me users ka data structure define karta hai.
 * Isme user ka naam, email, password, role ('user' ya 'admin'), aur creation date save hoti hai.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true, // Har user ka email unique hona chahiye
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be either "user" or "admin"',
      },
      default: 'user', // By default normal user banega
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Yeh automatically createdAt aur updatedAt manage karega
    timestamps: true,
  }
);

/**
 * Pre-Save Hook (Middleware):
 * Jab bhi user document save hone wala hota hai, ye hook automatically run hota hai.
 * Agar user ne password banaya ya change kiya hai, toh ye bcrypt use karke
 * plain-text password ko secure hash me convert kar deta hai taaki database me password safe rahe.
 */
userSchema.pre('save', async function (next) {
  // Agar password modify nahi hua hai, toh next step par chale jao (hashing skip karo)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // 10 rounds ka salt generate kar rahe hain
    const salt = await bcrypt.genSalt(10);
    // Password ko hash karke database me save hone ke liye set kar rahe hain
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * comparePassword Method:
 * User model ka custom method jo login ke time call hota hai.
 * Ye check karta hai ki user ne jo password enter kiya hai wo database ke hashed password se match karta hai ya nahi.
 * bcrypt.compare se true ya false return hota hai.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
