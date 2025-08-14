const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.autoResendReviewRequests = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    try {
      console.log('🔄 Starting auto-resend process...');
      
      const db = admin.firestore();
      const now = new Date();
      
      // Find expired, unclicked review links
      const expiredLinks = await db.collection('reviewTracking')
        .where('clicked', '==', false)
        .where('expiresAt', '<=', now)
        .get();
      
      console.log(`📧 Found ${expiredLinks.size} expired links to resend.`);
      
      let resendCount = 0;
      
      for (const doc of expiredLinks.docs) {
        const tracking = doc.data();
        
        try {
          // Update tracking record
          await doc.ref.update({
            resendCount: admin.firestore.FieldValue.increment(1),
            lastResentAt: now,
            expiresAt: new Date(Date.now() + 1 * 60 * 1000) // Reset expiration
          });
          
          // Log the resend
          console.log(`📤 Resending ${tracking.channel} to ${tracking.to} for patient ${tracking.patientFullName}`);
          
          // Here you would integrate with your SMS/Email sending logic
          // For now, just log the resend
          resendCount++;
          
        } catch (error) {
          console.error(`❌ Failed to resend ${tracking.channel} to ${tracking.to}:`, error);
        }
      }
      
      console.log(`🎉 Successfully processed ${resendCount} resends.`);
      return { success: true, resendCount };
      
    } catch (error) {
      console.error('❌ Auto-resend failed:', error);
      throw error;
    }
  });
