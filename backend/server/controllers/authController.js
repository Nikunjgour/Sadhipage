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
        message: 'Kripya apna name, email aur password teeno provide karein.',
      });
    }

    // Email format validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Kripya ek valid email address enter karein.',
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Password kam se kam 6 characters ka hona chahiye.',
      });
    }

    // Check kar rahe hain ki email pehle se registered toh nahi hai
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Is email address se user pehle se registered hai.',
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
      message: 'User registration successful ho gaya!',
    });
  } catch (error) {
    console.error('[registerUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Registration ke dauran server error aaya.',
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
        message: 'Login karne ke liye email aur password dono daalna zaroori hai.',
      });
    }

    // Database me user ko email se search kar rahe hain
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Galat email ya password. Kripya check karein.',
      });
    }

    // User ka password check kar raha hai login ke time bcrypt compare se
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Galat email ya password. Kripya check karein.',
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
      message: 'Login successfully ho gaya!',
    });
  } catch (error) {
    console.error('[loginUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Login ke dauran server error aaya.',
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
        message: 'User profile database me nahi mili.',
      });
    }

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: {
        user,
      },
      user,
      message: 'User profile successfully fetch ho gayi.',
    });
  } catch (error) {
    console.error('[getProfile Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'User profile fetch karne me server error aaya.',
      error: error.message,
    });
  }
};

