import Wedding from '../models/Wedding.js';
import Rsvp from '../models/Rsvp.js';

/**
 * Shared helper to cascade-delete wedding documents and their associated RSVPs.
 * Deletes RSVPs matching either the wedding's ObjectId or its shareSlug,
 * then deletes the weddings.
 *
 * @param {Array<import('mongoose').Types.ObjectId|string>} weddingIds - Array of Wedding _ids
 * @param {Array<string>} slugs - Array of Wedding shareSlugs
 * @returns {Promise<{ deletedWeddings: number, deletedRsvps: number }>}
 */
export const deleteWeddingsAndRsvps = async (weddingIds = [], slugs = []) => {
  const cleanIds = (weddingIds || []).filter(Boolean);
  const cleanSlugs = (slugs || []).filter(Boolean);

  let deletedRsvps = 0;
  let deletedWeddings = 0;

  // Build $or query for RSVPs to ensure all associated RSVPs are removed
  const rsvpConditions = [];
  if (cleanIds.length > 0) {
    rsvpConditions.push({ wedding: { $in: cleanIds } });
  }
  if (cleanSlugs.length > 0) {
    rsvpConditions.push({ weddingSlug: { $in: cleanSlugs } });
  }

  if (rsvpConditions.length > 0) {
    const rsvpResult = await Rsvp.deleteMany(
      rsvpConditions.length === 1 ? rsvpConditions[0] : { $or: rsvpConditions }
    );
    deletedRsvps = rsvpResult.deletedCount || 0;
  }

  if (cleanIds.length > 0) {
    const weddingResult = await Wedding.deleteMany({ _id: { $in: cleanIds } });
    deletedWeddings = weddingResult.deletedCount || 0;
  }

  return { deletedWeddings, deletedRsvps };
};
