import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect Middleware:
 * Ye middleware protected routes ko secure karne ke liye use hota hai.
 * 1. Request ke 'Authorization' header se Bearer token nikalta hai.
 * 2. JWT_SECRET ke through token ko verify karta hai.
 * 3. Token ke payload se user ID nikal kar database se user fetch karta hai (password ko chhod kar).
 * 4. User data ko `req.user` me attach kar deta hai taaki aage ke controllers use access kar sakein.
 * 5. Agar token nahi milta ya invalid hota hai, toh 401 Unauthorized status return karta hai.
 */
export const protect = async (req, res, next) => {
  let token;

  // Check kar rahe hain ki header me "Bearer <token>" hai ya nahi
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // "Bearer " ke baad wala token string alag kar rahe hain
      token = req.headers.authorization.split(' ')[1];

      // JWT token ko secret key se decode aur verify kar rahe hain
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Decoded ID se database se user fetch karke req.user me set kar rahe hain (password exclude karke)
      req.user = await User.findById(decoded.id).select('-password');

      // Agar user database me exist nahi karta
      if (!req.user) {
        return res.status(401).json({
          success: false,
          data: null,
          message: 'Not authorized: Is token se juda user database me nahi mila.',
        });
      }

      // Token sahi hai, agle middleware ya controller par jao
      next();
    } catch (error) {
      console.error('[Auth Middleware Error]:', error.message);
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Not authorized: Token invalid, expire ya corrupt ho chuka hai.',
      });
    }
  }

  // Agar request ke header me token mila hi nahi
  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Not authorized: Authorization header me Bearer token missing hai.',
    });
  }
};

/**
 * isAdmin Middleware:
 * Ye middleware check karta hai ki logged-in user admin hai ya normal user.
 * 
 * @param {Object} req - Request object jisme req.user set hai
 * @param {Object} res - Response object
 * @param {Function} next - Next handler callback
 */
export const isAdmin = (req, res, next) => {
  // Check kar rahe hain ki user ka role 'admin' hai ya nahi
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Access forbidden: Ye action perform karne ke liye Admin permissions chahiye.',
    });
  }
};

