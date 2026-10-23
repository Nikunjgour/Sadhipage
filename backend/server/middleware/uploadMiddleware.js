import multer from 'multer';

/**
 * Memory Storage Configuration:
 * Multer ko configure kar rahe hain taaki uploaded file disk/hard drive pe save hone ki jagah
 * seedhe server ki memory (RAM buffer) me temporarily hold ho sake.
 * Iska fayda ye hai ki hum buffer ko direct Cloudinary pe stream kar sakte hain bina server pe temporary file jamaye.
 */
const storage = multer.memoryStorage();

/**
 * File Filter Function:
 * Ye function check karta hai ki user ne jo file upload ki hai wo valid image hai ya nahi.
 * MIME type check karta hai - sirf image files (JPEG, JPG, PNG, WEBP, GIF) ko allow karega.
 * Agar koi PDF, video ya text file upload karega toh error dekar reject kar dega.
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - Upload ho rahi file ka data
 * @param {Function} cb - Multer ka callback (error, acceptBoolean)
 */
const fileFilter = (req, file, cb) => {
  // Check kar rahe hain ki file ka mimetype 'image/' se start hota hai ya nahi
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Image file accept kar li
  } else {
    cb(
      new Error('Sirf image files (JPEG, PNG, WEBP, GIF) hi upload karne ki permission hai!'),
      false // Non-image file reject kar di
    );
  }
};

/**
 * Multer Upload Instance:
 * Multer ka main middleware instance jisme memory storage, image filter,
 * aur maximum 5MB (5 * 1024 * 1024 bytes) file size ka limit set kiya gaya hai.
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maximum file size 5MB allowed hai
  },
});

export default upload;
