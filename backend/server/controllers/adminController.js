import User from '../models/User.js';
import Wedding from '../models/Wedding.js';
import Rsvp from '../models/Rsvp.js';
import { deleteWeddingsAndRsvps } from '../utils/cascadeHelper.js';

/**
 * getAllUsers Controller (Admin Only):
 * Platform ke saare registered users ki list laata hai.
 * Security ke liye password hash ko select('-password') karke exclude kar diya jata hai.
 * 
 * Kaam karne ka flow:
 * 1. MongoDB se saare users fetch karta hai latest registration ke hisaab se sort karke.
 * 2. Total count aur users ka array 200 OK status ke sath bhejta hai.
 * 
 * @param {Object} req - Admin request object
 * @param {Object} res - Response object
 */
export const getAllUsers = async (req, res) => {
  try {
    // Database se saare users fetch kar rahe hain (password exclude karke)
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // CHANGED: Consistent { success, data, message } response format
    return res.status(200).json({
      success: true,
      data: {
        users,
        count: users.length,
      },
      count: users.length,
      users,
      message: 'Users list fetched successfully.',
    });
  } catch (error) {
    console.error('[getAllUsers Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error fetching users list.',
      error: error.message,
    });
  }
};

/**
 * getAllWeddingPages Controller (Admin Only):
 * Platform par banaye gaye saare wedding pages ki list laata hai.
 * 
 * @param {Object} req - Admin request object
 * @param {Object} res - Response object
 */
export const getAllWeddingPages = async (req, res) => {
  try {
    // Saare wedding pages aur unke user details database se fetch kiye
    const weddings = await Wedding.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    // CHANGED: Frontend w.owner?.name aur w.user?.name dono support karne ke liye formattedWeddings banaya
    const formattedWeddings = weddings.map((w) => {
      const obj = w.toObject();
      obj.owner = obj.user || { name: 'Owner', email: 'N/A' };
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: {
        weddings: formattedWeddings,
        count: formattedWeddings.length,
      },
      count: formattedWeddings.length,
      weddings: formattedWeddings,
      message: 'Weddings list fetched successfully.',
    });
  } catch (error) {
    console.error('[getAllWeddingPages Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error fetching wedding pages list.',
      error: error.message,
    });
  }
};

/**
 * deleteUser Controller (Admin Only):
 * Kisi bhi specific user account ko uski ID se permanently delete karta hai.
 * 
 * @param {Object} req - Request object jisme params me user ID hai
 * @param {Object} res - Response object
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // (a) Pehle target user load karte hain
    const target = await User.findById(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `User with ID ${id} was not found.`,
      });
    }

    // Admin accounts delete nahi ho sakte (covers self-delete aur koi bhi admin)
    if (target.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be deleted.',
      });
    }

    // (b) User ke saare wedding documents dhoondhte hain (old data me 1 se zyada bhi ho sakti hain)
    const weddings = await Wedding.find({ user: target._id });

    // (c) Unke _id aur shareSlug values collect karte hain
    const weddingIds = weddings.map((w) => w._id);
    const slugs = weddings.map((w) => w.shareSlug).filter(Boolean);

    // (d) & (e) RSVPs aur weddings ko shared helper se delete karte hain
    const { deletedWeddings, deletedRsvps } = await deleteWeddingsAndRsvps(weddingIds, slugs);

    // (f) Finally user document delete karte hain
    await User.findByIdAndDelete(target._id);

    // Console logging format
    console.log(`[Cascade] deleted ${deletedWeddings} weddings and ${deletedRsvps} RSVPs for user ${target._id}`);

    return res.status(200).json({
      success: true,
      data: {
        deletedWeddings,
        deletedRsvps,
      },
      deletedWeddings,
      deletedRsvps,
      message: `User ${target.email} and associated wedding data (${deletedWeddings} weddings, ${deletedRsvps} RSVPs) were deleted successfully.`,
    });
  } catch (error) {
    console.error('[deleteUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error deleting user: ' + error.message,
      error: error.message,
    });
  }
};

/**
 * deleteWeddingPage Controller (Admin Only):
 * Kisi bhi wedding page ko uski MongoDB document ID se permanently delete karta hai
 * aur uske saare RSVP responses ko bhi cascade delete karta hai.
 * 
 * @param {Object} req - Request object jisme params me wedding ID hai
 * @param {Object} res - Response object
 */
export const deleteWeddingPage = async (req, res) => {
  try {
    const { id } = req.params;

    // Pehle wedding document dhoondhte hain
    const wedding = await Wedding.findById(id);

    if (!wedding) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Wedding page with ID ${id} was not found.`,
      });
    }

    // Shared cascade helper se RSVPs aur wedding delete karte hain
    const { deletedRsvps } = await deleteWeddingsAndRsvps(
      [wedding._id],
      wedding.shareSlug ? [wedding.shareSlug] : []
    );

    console.log(`[Cascade] deleted 1 weddings and ${deletedRsvps} RSVPs for wedding ${wedding._id}`);

    return res.status(200).json({
      success: true,
      data: {
        deletedRsvps,
      },
      deletedRsvps,
      message: `Wedding page for ${wedding.brideName} and ${wedding.groomName} and ${deletedRsvps} RSVPs were deleted successfully.`,
    });
  } catch (error) {
    console.error('[deleteWeddingPage Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error deleting wedding page: ' + error.message,
      error: error.message,
    });
  }
};

/**
 * getAnalytics Controller (Admin Only):
 * Admin dashboard ke liye platform-wide analytics aur statistical counts calculate karta hai.
 * 
 * @param {Object} req - Admin request object
 * @param {Object} res - Response object
 */
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();

    // 7 din pehle ka time filter (iss hafte ka data)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    // 30 din pehle ka time filter (iss mahine ka data)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);

    // Promise.all se saari count queries parallel me execute kar rahe hain performance ke liye
    const [
      totalUsers,
      totalWeddings,
      totalGeneratedPages,
      pagesCreatedThisWeek,
      pagesCreatedThisMonth,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }), // Total normal users
      Wedding.countDocuments(), // Total weddings
      Wedding.countDocuments({
        generatedHTML: { $exists: true, $ne: '' }, // Jinka AI HTML generate ho chuka hai
      }),
      Wedding.countDocuments({
        createdAt: { $gte: oneWeekAgo }, // Pichle 7 din me bane pages
      }),
      Wedding.countDocuments({
        createdAt: { $gte: oneMonthAgo }, // Pichle 30 din me bane pages
      }),
    ]);

    // CHANGED: Dono keys provide kiye taaki frontend kisi bhi naming convention se access kar sake
    const analyticsPayload = {
      totalUsers,
      totalWeddings,
      totalGeneratedPages,
      pagesThisWeek: pagesCreatedThisWeek,
      pagesCreatedThisWeek,
      pagesThisMonth: pagesCreatedThisMonth,
      pagesCreatedThisMonth,
    };

    return res.status(200).json({
      success: true,
      data: {
        analytics: analyticsPayload,
      },
      analytics: analyticsPayload,
      message: 'Analytics data calculated successfully.',
    });
  } catch (error) {
    console.error('[getAnalytics Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'A server error occurred while calculating analytics data.',
      error: error.message,
    });
  }
};

/**
 * updateUserByAdmin Controller (Admin Only):
 * PUT /api/admin/users/:id
 */
export const updateUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `User with ID ${id} was not found in the database.`,
      });
    }

    // Admin accounts cannot be edited
    if (targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be edited.',
      });
    }

    // Role aur password ignore kiya jata hai — sirf name/email edit ho sakta hai
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    // Database me user update kar rahe hain aur password field ko exclude rakhte hain
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
      user: updatedUser,
      message: 'User details updated successfully.',
    });
  } catch (error) {
    console.error('[updateUserByAdmin Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'An error occurred while updating the user.',
      error: error.message,
    });
  }
};

/**
 * updateWeddingByAdmin Controller (Admin Only):
 * PUT /api/admin/weddings/:id
 */
export const updateWeddingByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { brideName, groomName, weddingDate, venue, story, generatedHTML } = req.body;

    // Allowed wedding fields collect kar rahe hain
    const updateData = {};
    if (brideName !== undefined) updateData.brideName = brideName;
    if (groomName !== undefined) updateData.groomName = groomName;
    if (weddingDate !== undefined) updateData.weddingDate = weddingDate;
    if (venue !== undefined) updateData.venue = venue;
    if (story !== undefined) updateData.story = story;
    if (generatedHTML !== undefined) updateData.generatedHTML = generatedHTML;

    // Database me wedding record update kiya
    const updatedWedding = await Wedding.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedWedding) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Wedding page with ID ${id} was not found.`,
      });
    }

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: {
        wedding: updatedWedding,
      },
      wedding: updatedWedding,
      message: 'Wedding page data updated successfully.',
    });
  } catch (error) {
    console.error('[updateWeddingByAdmin Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'An error occurred while updating the wedding page.',
      error: error.message,
    });
  }
};


