import { v2 as cloudinary } from 'cloudinary';
import Wedding from '../models/Wedding.js';
import Rsvp from '../models/Rsvp.js';

/**
 * getCloudinary Helper:
 * ES modules me imports hoist hote hain, isliye pehle cloudinary.config() top
 * level par chal jata tha — dotenv (server.js) load hone se PEHLE. Tab process.env
 * khali hota tha aur Cloudinary "Must supply api_key" error deta tha.
 * Ab credentials call-time par read hote hain aur missing hone par ek clear error
 * milta hai (cryptic SDK error ke bajaye).
 *
 * @returns {Object} - Configured Cloudinary v2 instance
 * @throws {Error} - Agar koi CLOUDINARY_* env variable .env me missing ho
 */
const getCloudinary = () => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  };
  const missing = Object.keys(config).filter((key) => !config[key]);
  if (missing.length > 0) {
    const err = new Error(
      `Server config error: backend/.env me ye variables missing hain: ${missing.join(', ')}. Cloud name, api key aur api secret teeno chahiye photo upload ke liye.`
    );
    err.statusCode = 500;
    throw err;
  }
  cloudinary.config(config);
  return cloudinary;
};

/**
 * uploadStreamToCloudinary Helper:
 * Ye helper function Multer ke RAM me rakhe binary buffer ko Cloudinary upload stream me pipe karta hai.
 * Isse bina disk pe temporary file banaye direct Cloudinary cloud pe image upload ho jati hai.
 * 
 * @param {Buffer} fileBuffer - RAM memory me rakha hua file ka binary data
 * @param {string} folder - Cloudinary me jis folder ke andar image save karni hai
 * @returns {Promise<Object>} - Cloudinary ka upload response (jisme secure_url hota hai)
 */
const uploadStreamToCloudinary = (fileBuffer, folder = 'shaadipage_weddings') => {
  // Config call-time par verify hota hai; env missing hone par clear error throw hota hai
  const client = getCloudinary();
  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * createWeddingInfo Controller:
 * Logged-in user ke shaadi ka profile aur details database me save karta hai.
 * 
 * Kaam karne ka flow:
 * 1. Check karta hai ki user ka pehle se wedding page toh nahi bana hua (ek user ka ek hi wedding page).
 * 2. Request body se dulhan ka naam, dulhe ka naam, date, venue, story aur slug nikalta hai.
 * 3. Logged-in user ki id (req.user._id) ke sath is wedding record ko link karta hai.
 * 4. MongoDB me naya Wedding document create karta hai.
 * 5. 201 Created status ke sath saved wedding details return karta hai.
 * 
 * @param {Object} req - Request object jisme body me shaadi ke details hain
 * @param {Object} res - Response object
 */
export const createWeddingInfo = async (req, res) => {
  try {
    const { brideName, groomName, weddingDate, venue, story, isPublic, shareSlug, photoUrl } = req.body;

    // Check kar rahe hain ki saari zaroori fields dali gayi hain ya nahi
    if (!brideName || !groomName || !weddingDate || !venue) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Kripya brideName, groomName, weddingDate aur venue zaroor provide karein.',
      });
    }

    // Check kar rahe hain ki kya user ne pehle se wedding page bana rakha hai
    const existingWedding = await Wedding.findOne({ user: req.user._id });
    if (existingWedding) {
      return res.status(400).json({
        success: false,
        data: { wedding: existingWedding },
        wedding: existingWedding,
        message: 'Aapka wedding page pehle se bana hua hai. Agar badalna hai toh update endpoint use karein.',
      });
    }

    // Agar custom slug diya hai, toh check karte hain ki wo kisi aur ka toh nahi hai
    if (shareSlug) {
      const slugExists = await Wedding.findOne({ shareSlug: shareSlug.toLowerCase() });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Ye shareSlug pehle se kisi aur ne le rakha hai. Kripya doosra slug chunein.',
        });
      }
    }

    // Naya wedding page database me save kar rahe hain (user id se link karke)
    const wedding = await Wedding.create({
      user: req.user._id,
      brideName,
      groomName,
      weddingDate,
      venue,
      story: story || '',
      photoUrl: photoUrl || '',
      isPublic: isPublic !== undefined ? isPublic : true,
      shareSlug: shareSlug ? shareSlug.toLowerCase() : undefined,
    });

    // CHANGED: Consistent { success, data, message } response
    return res.status(201).json({
      success: true,
      data: { wedding },
      wedding,
      message: 'Wedding page details successfully save ho gaye!',
    });
  } catch (error) {
    console.error('[createWeddingInfo Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Wedding profile create karne me server error aaya.',
      error: error.message,
    });
  }
};

/**
 * getMyWeddingPage Controller:
 * Logged-in user ka khud ka wedding page aur AI generated HTML website fetch karta hai.
 * 
 * @param {Object} req - Request object jisme authenticated user (req.user) hai
 * @param {Object} res - Response object
 */
export const getMyWeddingPage = async (req, res) => {
  try {
    // Database se logged-in user ka wedding document nikal rahe hain
    const wedding = await Wedding.findOne({ user: req.user._id }).populate(
      'user',
      'name email'
    );

    if (!wedding) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Aapka koi wedding page nahi mila. Kripya pehle naya wedding page banayein.',
      });
    }

    // Is wedding ke RSVPs bhi fetch kar rahe hain dashboard display ke liye
    const rsvps = await Rsvp.find({ wedding: wedding._id }).sort({ createdAt: -1 });

    // CHANGED: Consistent { success, data, message } response with rsvps
    return res.status(200).json({
      success: true,
      data: { wedding, rsvps },
      wedding,
      rsvps,
      message: 'Wedding details successfully praapt ho gayi.',
    });
  } catch (error) {
    console.error('[getMyWeddingPage Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Wedding page retrieve karne me error aaya.',
      error: error.message,
    });
  }
};


/**
 * updateWeddingInfo Controller:
 * Logged-in user ke existing wedding details ko update karta hai.
 * 
 * Kaam karne ka flow:
 * 1. Database me user ka wedding record dhoondhta hai.
 * 2. Request body me aaye naye fields (naam, date, venue, story, photoUrl, etc.) ko update karta hai.
 * 3. Agar shareSlug change ho raha hai toh uniqueness verify karta hai.
 * 4. Updated document ko save karke 200 OK return karta hai.
 * 
 * @param {Object} req - Request object jisme updated values hain
 * @param {Object} res - Response object
 */
export const updateWeddingInfo = async (req, res) => {
  try {
    // User ka existing wedding record search kiya
    const wedding = await Wedding.findOne({ user: req.user._id });

    if (!wedding) {
      return res.status(404).json({
        success: false,
        message: 'Update karne ke liye wedding page nahi mila.',
      });
    }

    const {
      brideName,
      groomName,
      weddingDate,
      venue,
      story,
      photoUrl,
      isPublic,
      shareSlug,
    } = req.body;

    // Agar slug change kiya hai toh check karo ki kisi aur wedding ne toh nahi liya
    if (shareSlug && shareSlug.toLowerCase() !== wedding.shareSlug) {
      const slugExists = await Wedding.findOne({
        shareSlug: shareSlug.toLowerCase(),
        _id: { $ne: wedding._id },
      });
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'Ye shareSlug pehle se kisi aur wedding page me use ho raha hai.',
        });
      }
      wedding.shareSlug = shareSlug.toLowerCase();
    }

    // Jo jo fields body me aayi hain unhe update kar rahe hain.
    // PHOTO GUARD: undefined AUR khali string dono ko ignore karte hain, taaki
    // existing photo kabhi galti se overwrite (ya delete) na ho.
    if (brideName !== undefined) wedding.brideName = brideName;
    if (groomName !== undefined) wedding.groomName = groomName;
    if (weddingDate !== undefined) wedding.weddingDate = weddingDate;
    if (venue !== undefined) wedding.venue = venue;
    if (story !== undefined) wedding.story = story;
    if (photoUrl !== undefined && photoUrl !== '') wedding.photoUrl = photoUrl;
    if (isPublic !== undefined) wedding.isPublic = isPublic;

    // Database me changes save kiya
    const updatedWedding = await wedding.save();

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: { wedding: updatedWedding },
      wedding: updatedWedding,
      message: 'Wedding page details successfully update ho gaye!',
    });
  } catch (error) {
    console.error('[updateWeddingInfo Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Wedding details update karne me server error aaya.',
      error: error.message,
    });
  }
};

/**
 * deleteWeddingInfo Controller:
 * Logged-in user ke wedding page aur uski website ko database se permanently delete karta hai.
 * 
 * @param {Object} req - Authenticated request
 * @param {Object} res - Response object
 */
export const deleteWeddingInfo = async (req, res) => {
  try {
    // Database se is user ka wedding page delete kar rahe hain
    const deletedWedding = await Wedding.findOneAndDelete({ user: req.user._id });

    if (!deletedWedding) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Delete karne ke liye koi wedding page nahi mila.',
      });
    }

    // Wedding ke saath uske RSVP documents bhi delete kar rahe hain (orphan na bachein)
    await Rsvp.deleteMany({ wedding: deletedWedding._id });

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: null,
      message: 'Wedding page successfully delete ho gaya!',
    });
  } catch (error) {
    console.error('[deleteWeddingInfo Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Wedding page delete karne me server error aaya.',
      error: error.message,
    });
  }
};

/**
 * getPublicWeddingPage Controller:
 * Public endpoint jo bina login kiye wedding page ko shareable URL slug se fetch karta hai.
 * 
 * @param {Object} req - Request object jisme params me shareSlug hai
 * @param {Object} res - Response object
 */
export const getPublicWeddingPage = async (req, res) => {
  try {
    const { shareSlug } = req.params;

    if (!shareSlug) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'shareSlug parameter dena zaroori hai.',
      });
    }

    // Database me shareSlug se wedding page search kiya
    const wedding = await Wedding.findOne({
      shareSlug: shareSlug.toLowerCase(),
    }).populate('user', 'name');

    if (!wedding) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Is link ke sath koi wedding page nahi mila.',
      });
    }

    // Agar user ne apna page private kiya hua hai toh access mana kar do
    if (!wedding.isPublic) {
      return res.status(403).json({
        success: false,
        data: { isPublic: false },
        isPublic: false,
        message: 'Ye wedding page private hai aur public ke liye accessible nahi hai.',
      });
    }

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: { wedding },
      wedding,
      message: 'Public wedding page successfully fetch ho gaya.',
    });
  } catch (error) {
    console.error('[getPublicWeddingPage Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Public wedding page load karne me error aaya.',
      error: error.message,
    });
  }
};

/**
 * uploadWeddingPhoto Controller:
 * Couple ki photo upload karta hai: Multer buffer se direct Cloudinary pe upload karta hai.
 * 
 * @param {Object} req - Request object jisme Multer se file aayi hai
 * @param {Object} res - Response object
 */
export const uploadWeddingPhoto = async (req, res) => {
  try {
    // Check kar rahe hain ki request me image file aayi hai ya nahi
    if (!req.file) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Kripya "photo" field name ke sath image file attach karein.',
      });
    }

    // File buffer ko direct Cloudinary pe stream karke upload kar rahe hain
    const cloudinaryResult = await uploadStreamToCloudinary(
      req.file.buffer,
      'shaadipage_weddings'
    );

    const secureUrl = cloudinaryResult.secure_url;

    // Logged-in user ka wedding document dhoondh rahe hain
    let wedding = await Wedding.findOne({ user: req.user._id });

    if (wedding) {
      // Naye photo ka Cloudinary URL wedding document me update kiya
      wedding.photoUrl = secureUrl;
      await wedding.save();
    }

    // CHANGED: Consistent { success, data, message } response
    return res.status(200).json({
      success: true,
      data: {
        photoUrl: secureUrl,
        wedding,
      },
      photoUrl: secureUrl,
      wedding,
      message: 'Wedding photo successfully Cloudinary par upload ho gayi!',
    });
  } catch (error) {
    console.error('[uploadWeddingPhoto Error]:', error.message);
    // Config error (missing env var) par variable ka naam batata hua clear message
    const message = /variables missing hain/.test(error.message)
      ? error.message
      : 'Cloudinary par photo upload fail ho gaya.';
    return res.status(500).json({
      success: false,
      data: null,
      message,
      error: error.message,
    });
  }
};

/**
 * createRsvp Controller:
 * Public endpoint jisse koi bhi wedding guest RSVP submit kar sakta hai (bina login ke).
 * 
 * @param {Object} req - Request body jisme weddingSlug, name, attending, guestCount hain
 * @param {Object} res - Response object
 */
export const createRsvp = async (req, res) => {
  try {
    const { weddingSlug, slug, shareSlug, name, guestName, attending, status, guestCount, email, note } = req.body;

    const targetSlug = (weddingSlug || slug || shareSlug || '').trim().toLowerCase();
    const guestFullName = (name || guestName || '').trim();

    // 1. Validation: Name check
    if (!guestFullName) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Please provide your full name to confirm RSVP.',
      });
    }

    // 2. Validation: Wedding slug check
    if (!targetSlug) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Wedding slug is required to submit an RSVP.',
      });
    }

    // 3. Find wedding by shareSlug
    const wedding = await Wedding.findOne({ shareSlug: targetSlug });
    if (!wedding) {
      return res.status(404).json({
        success: false,
        data: null,
        message: `Wedding not found with link: "${targetSlug}".`,
      });
    }

    // 4. Normalize attendance status
    const rawAttending = (attending || status || 'yes').trim().toLowerCase();
    const isAttending = ['yes', 'attending', 'true'].includes(rawAttending);
    const normalizedAttending = isAttending ? 'yes' : 'no';

    // 5. Validate guestCount
    let parsedGuestCount = parseInt(guestCount, 10);
    if (isNaN(parsedGuestCount)) {
      parsedGuestCount = isAttending ? 1 : 0;
    }
    if (isAttending && parsedGuestCount < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Guest count must be at least 1 if attending.',
      });
    }
    if (!isAttending) {
      parsedGuestCount = 0;
    }

    // 6. Save RSVP record
    const rsvp = await Rsvp.create({
      wedding: wedding._id,
      weddingSlug: wedding.shareSlug,
      name: guestFullName,
      attending: normalizedAttending,
      guestCount: parsedGuestCount,
      email: email ? email.trim() : '',
      note: note ? note.trim() : '',
    });

    return res.status(201).json({
      success: true,
      data: { rsvp },
      rsvp,
      message: 'Thank you, your RSVP is confirmed!',
    });
  } catch (error) {
    console.error('[createRsvp Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to submit RSVP. Please try again.',
      error: error.message,
    });
  }
};

/**
 * getWeddingRsvps Controller:
 * Logged-in wedding owner ke liye uski wedding ke saare RSVPs aur stats fetch karta hai.
 * 
 * @param {Object} req - Authenticated request (req.user)
 * @param {Object} res - Response object
 */
export const getWeddingRsvps = async (req, res) => {
  try {
    const wedding = await Wedding.findOne({ user: req.user._id });
    if (!wedding) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Wedding page not found for this user.',
      });
    }

    const rsvps = await Rsvp.find({ wedding: wedding._id }).sort({ createdAt: -1 });

    const attendingCount = rsvps.filter((r) => r.attending === 'yes' || r.attending === 'attending').length;
    const declinedCount = rsvps.filter((r) => r.attending === 'no' || r.attending === 'declined').length;
    const totalGuests = rsvps.reduce((acc, curr) => acc + (curr.guestCount || 0), 0);

    const stats = {
      total: rsvps.length,
      attendingCount,
      declinedCount,
      totalGuests,
    };

    return res.status(200).json({
      success: true,
      data: {
        rsvps,
        stats,
      },
      rsvps,
      stats,
      message: 'RSVPs fetched successfully.',
    });
  } catch (error) {
    console.error('[getWeddingRsvps Error]:', error.message);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error fetching RSVPs.',
      error: error.message,
    });
  }
};

