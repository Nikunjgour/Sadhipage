import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * generateToken Helper:
 * Ye helper function user ki MongoDB _id ko lekar ek signed JWT (JSON Web Token) banata hai.
 * JWT_SECRET se sign hota hai aur iski validity 30 din ki set ki gayi hai.
 * 
 * @param {string} id - Authenticated user ki MongoDB _id
 * @returns {string} - Signed JWT token string
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * registerUser Controller:
 * Naye user ko register karta hai ShaadiPage par.
 * 
 * Kaam karne ka flow:
 * 1. Request body se name, email aur password nikalta hai.
 * 2. Check karta hai ki saari required fields user ne bheji hain ya nahi.
 * 3. Database me check karta hai ki is email se koi account pehle se toh nahi bana.
 * 4. Naya User document create karta hai (password User model ke pre-save hook se auto-hash ho jata hai).
 * 5. Automatic login ke liye JWT token generate karta hai.
 * 6. 201 Created status aur user details (password chhod kar) return karta hai.
 * 
 * @param {Object} req - Client se aayi request jisme body me user details hain
 * @param {Object} res - Server ka response object
 */
export const registerUser = async (req, res) => {
  try {
    // SECURITY: sirf name/email/password body se accept karte hain; role
    // request body se kabhi nahi lete (privilege escalation se bachne ke liye)
    const { name, email, password } = req.body;

    // Check kar rahe hain ki mandatory fields empty toh nahi hain
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Please provide name, email, and password.',
      });
    }

    // Email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Please enter a valid email address.',
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check kar rahe hain ki email pehle se registered toh nahi hai
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'A user is already registered with this email address.',
      });
    }

    // Naya user create kar rahe hain — role hamesha 'user' hi rahega.
    // Admin role sirf database level par manually set hota hai.
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'user',
    });

    // Login session ke liye JWT token generate kiya
    const token = generateToken(user._id);
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    // CHANGED: Consistent { success, data, message } format me response
    return res.status(201).json({
      success: true,
      data: {
        token,
        user: userData,
      },
      // Backward compatibility ke liye top-level fields bhi rakhe hain
      token,
      user: userData,
      message: 'User registration successful!',
    });
  } catch (error) {
    console.error('[registerUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

/**
 * loginUser Controller:
 * Existing user ko unke email aur password se authenticate karta hai.
 * 
 * @param {Object} req - Request object jisme login credentials hain
 * @param {Object} res - Response object
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Email aur password ka input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Both email and password are required to log in.',
      });
    }

    // Database me user ko email se search kar rahe hain
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    // User ka password check kar raha hai login ke time bcrypt compare se
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password. Please check your credentials.',
      });
    }

    // Credentials sahi hain, toh JWT token create kiya
    const token = generateToken(user._id);
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: userData,
      },
      token,
      user: userData,
      message: 'Login successful!',
    });
  } catch (error) {
    console.error('[loginUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

/**
 * changePassword Controller:
 * Logged-in user apna password change karta hai (PUT /api/auth/change-password, protected).
 *
 * Kaam karne ka flow:
 * 1. Body se currentPassword aur newPassword validate karta hai (required, 6-72 chars, different).
 * 2. User ko password field ke sath load karke currentPassword check karta hai (bcrypt).
 * 3. New password set karta hai — pre-save hook ise hash karega, plain text store nahi hota.
 * 4. passwordChangedAt timestamp set hota hai taaki purane tokens dusre devices par reject ho jayein.
 * 5. Fresh JWT generate karke return karta hai (login jaisa hi payload/expiry: { id }, 30d).
 *
 * NOTE: Passwords request/response me kabhi log nahi kiye jaate.
 *
 * @param {Object} req - Authenticated request jisme { currentPassword, newPassword } hai
 * @param {Object} res - Response object
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Both fields are required strings
    if (
      !currentPassword ||
      !newPassword ||
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Both current password and new password are required.',
      });
    }

    // Same length rule as the register endpoint (at least 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // bcrypt hashes support a maximum of 72 characters
    if (newPassword.length > 72) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Password cannot exceed 72 characters.',
      });
    }

    // New password must differ from the current one
    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'New password must be different from the current password.',
      });
    }

    // SECURITY: Sirf token ke user ka password change ho sakta hai.
    // Password field ko explicitly select karna hota hai (schema par select:false nahi hai,
    // phir bhi clear rakhne ke liye +password use kar rahe hain).
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found.',
      });
    }

    // Existing comparePassword method se current password verify karte hain.
    // 400 (not 401) sha diya gaya hai taaki frontend auto-logout na kare.
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Current password is incorrect.',
      });
    }

    // Pre-save hook is plain password ko bcrypt hash me convert karega
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Fresh JWT issue karte hain — bilkul login jaisa payload ({ id }) aur expiry (30d).
    // Iska iat passwordChangedAt ke baad ka hai, isliye current session valid rehta hai.
    const token = generateToken(user._id);

    // CHANGED: Consistent { success, data, message } format me response
    return res.status(200).json({
      success: true,
      data: { token },
      // Backward compatibility ke liye top-level token bhi bhej rahe hain
      token,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    // SECURITY: Password values ko kabhi log na karein — sirf error message
    console.error('[changePassword Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while changing password.',
      error: error.message,
    });
  }
};

/**
 * getProfile Controller:
 * Currently logged-in user ki profile information laata hai.
 * 
 * @param {Object} req - Authenticated request jisme req.user available hai
 * @param {Object} res - Response object
 */
export const getProfile = async (req, res) => {
  try {
    // req.user protect middleware se milta hai, password ko select se hata diya
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User profile not found.',
      });
    }

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: {
        user,
      },
      user,
      message: 'User profile fetched successfully.',
    });
  } catch (error) {
    console.error('[getProfile Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while fetching user profile.',
      error: error.message,
    });
  }
};

