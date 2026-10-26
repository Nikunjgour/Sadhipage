import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'dns';

import User from '../models/User.js';
import Wedding from '../models/Wedding.js';
import Rsvp from '../models/Rsvp.js';
import { deleteWeddingsAndRsvps } from '../utils/cascadeHelper.js';

// Setup DNS servers for MongoDB Atlas SRV lookup resilience
dns.setServers(['1.1.1.1', '1.0.0.1']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables without printing secrets
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const isApply = process.argv.includes('--apply');

async function runCleanup() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('[Error] MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log(`[MongoDB Connected] Running orphan cleanup in ${isApply ? 'APPLY' : 'DRY RUN'} mode...`);

    // 1. Find Wedding documents whose user no longer exists in users collection
    const allWeddings = await Wedding.find().select('_id user shareSlug brideName groomName');
    const userIds = [...new Set(allWeddings.map((w) => w.user?.toString()).filter(Boolean))];
    const existingUsers = await User.find({ _id: { $in: userIds } }).select('_id');
    const existingUserSet = new Set(existingUsers.map((u) => u._id.toString()));

    const orphanWeddings = allWeddings.filter(
      (w) => !w.user || !existingUserSet.has(w.user.toString())
    );

    const orphanWeddingIds = orphanWeddings.map((w) => w._id);
    const orphanWeddingSlugs = orphanWeddings.map((w) => w.shareSlug).filter(Boolean);

    // Find RSVPs linked to these orphan weddings
    let orphanWeddingRsvps = [];
    if (orphanWeddingIds.length > 0 || orphanWeddingSlugs.length > 0) {
      const orConditions = [];
      if (orphanWeddingIds.length > 0) orConditions.push({ wedding: { $in: orphanWeddingIds } });
      if (orphanWeddingSlugs.length > 0) orConditions.push({ weddingSlug: { $in: orphanWeddingSlugs } });
      orphanWeddingRsvps = await Rsvp.find(
        orConditions.length === 1 ? orConditions[0] : { $or: orConditions }
      ).select('_id wedding weddingSlug');
    }

    // 2. Find Rsvp documents whose wedding no longer exists in weddings collection
    const orphanWeddingRsvpIdSet = new Set(orphanWeddingRsvps.map((r) => r._id.toString()));
    const allActiveWeddings = await Wedding.find().select('_id shareSlug');
    const activeWeddingIdSet = new Set(allActiveWeddings.map((w) => w._id.toString()));
    const activeWeddingSlugSet = new Set(allActiveWeddings.map((w) => w.shareSlug).filter(Boolean));

    const allRsvps = await Rsvp.find().select('_id wedding weddingSlug name email');
    const standaloneOrphanRsvps = allRsvps.filter((r) => {
      if (orphanWeddingRsvpIdSet.has(r._id.toString())) return false;
      const idMatches = r.wedding && activeWeddingIdSet.has(r.wedding.toString());
      const slugMatches = r.weddingSlug && activeWeddingSlugSet.has(r.weddingSlug.toLowerCase());
      return !idMatches && !slugMatches;
    });

    console.log('----------------------------------------------------');
    console.log(`Orphan Weddings found (user missing): ${orphanWeddings.length}`);
    if (orphanWeddings.length > 0) {
      console.log(
        'Orphan Wedding IDs:',
        orphanWeddings.map((w) => `${w._id} (Bride: ${w.brideName}, Groom: ${w.groomName})`)
      );
    }
    console.log(`RSVPs belonging to orphan weddings: ${orphanWeddingRsvps.length}`);
    if (orphanWeddingRsvps.length > 0) {
      console.log('Orphan Wedding RSVP IDs:', orphanWeddingRsvps.map((r) => r._id));
    }

    console.log(`Standalone Orphan RSVPs (wedding does not exist): ${standaloneOrphanRsvps.length}`);
    if (standaloneOrphanRsvps.length > 0) {
      console.log('Standalone Orphan RSVP IDs:', standaloneOrphanRsvps.map((r) => r._id));
    }
    console.log('----------------------------------------------------');

    if (!isApply) {
      console.log('[DRY RUN] No documents were deleted. To perform deletion, rerun with: npm run cleanup:orphans -- --apply');
    } else {
      console.log('[APPLY] Deleting orphan data...');
      let totalDeletedWeddings = 0;
      let totalDeletedRsvps = 0;

      // Delete orphan weddings and their RSVPs
      if (orphanWeddingIds.length > 0) {
        const result = await deleteWeddingsAndRsvps(orphanWeddingIds, orphanWeddingSlugs);
        totalDeletedWeddings += result.deletedWeddings;
        totalDeletedRsvps += result.deletedRsvps;
      }

      // Delete standalone orphan RSVPs
      if (standaloneOrphanRsvps.length > 0) {
        const orphanRsvpIds = standaloneOrphanRsvps.map((r) => r._id);
        const rsvpDelResult = await Rsvp.deleteMany({ _id: { $in: orphanRsvpIds } });
        totalDeletedRsvps += rsvpDelResult.deletedCount || 0;
      }

      console.log(`[APPLY] Cleanup completed! Deleted ${totalDeletedWeddings} orphan weddings and ${totalDeletedRsvps} orphan RSVPs.`);
    }
  } catch (error) {
    console.error('[Cleanup Error]:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('[MongoDB Disconnected]');
  }
}

runCleanup();
