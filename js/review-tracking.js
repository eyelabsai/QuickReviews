// Review Link Tracking and Auto-Resend Functions
// This file contains functions for tracking review link clicks and automatically resending expired links

// Function to mark a review link as clicked
async function markReviewLinkClicked(trackingId) {
  try {
    const db = firebase.firestore();
    await db.collection('reviewTracking').doc(trackingId).update({
      clicked: true,
      clickedAt: firebase.firestore.FieldValue.serverTimestamp(),
      clickCount: firebase.firestore.FieldValue.increment(1)
    });
    console.log('Review link marked as clicked:', trackingId);
  } catch (error) {
    console.error('Failed to mark review link as clicked:', error);
  }
}

// Function to check for expired links and resend them
async function checkAndResendExpiredLinks() {
  try {
    const db = firebase.firestore();
    const now = new Date();
    
    // Find all unclicked review links that are older than 3 days
    const expiredLinks = await db.collection('reviewTracking')
      .where('clicked', '==', false)
      .where('expiresAt', '<=', now)
      .where('resendCount', '<', 3) // Limit to 3 resends
      .get();
    
    if (expiredLinks.empty) {
      console.log('No expired review links found to resend.');
      return { resendCount: 0 };
    }
    
    let resendCount = 0;
    for (const doc of expiredLinks.docs) {
      const tracking = doc.data();
      
      try {
        // Resend the message
        if (tracking.channel === 'sms') {
          const smsPayload = {
            to: tracking.to,
            body: tracking.message
          };
          await db.collection("messages").add(smsPayload);
        } else if (tracking.channel === 'email') {
          const mailPayload = {
            to: tracking.to,
            from: 'feedback@ezreviews.app',
            message: {
              subject: `We'd love your feedback! (Reminder)`,
              html: tracking.message.replace(/\n/g, '<br>')
            }
          };
          await db.collection("mail").add(mailPayload);
        }
        
        // Update tracking record
        await doc.ref.update({
          resendCount: firebase.firestore.FieldValue.increment(1),
          lastResentAt: firebase.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 1 * 60 * 1000) // Reset expiration (1 minute for testing)
        });
        
        resendCount++;
      } catch (error) {
        console.error('Failed to resend for tracking ID:', doc.id, error);
      }
    }
    
    console.log(`Successfully resent ${resendCount} review requests.`);
    return { resendCount };
    
  } catch (error) {
    console.error('Error checking expired links:', error);
    throw error;
  }
}

// Function to get tracking statistics
async function getTrackingStats() {
  try {
    const db = firebase.firestore();
    const now = new Date();
    
    // Get total tracking records
    const totalSnapshot = await db.collection('reviewTracking').get();
    const total = totalSnapshot.size;
    
    // Get clicked records
    const clickedSnapshot = await db.collection('reviewTracking')
      .where('clicked', '==', true)
      .get();
    const clicked = clickedSnapshot.size;
    
    // Get expired unclicked records
    const expiredSnapshot = await db.collection('reviewTracking')
      .where('clicked', '==', false)
      .where('expiresAt', '<=', now)
      .get();
    const expired = expiredSnapshot.size;
    
    // Get records due for resend
    const dueForResendSnapshot = await db.collection('reviewTracking')
      .where('clicked', '==', false)
      .where('expiresAt', '<=', now)
      .where('resendCount', '<', 3)
      .get();
    const dueForResend = dueForResendSnapshot.size;
    
    return {
      total,
      clicked,
      expired,
      dueForResend,
      clickRate: total > 0 ? (clicked / total * 100).toFixed(1) : 0
    };
  } catch (error) {
    console.error('Failed to get tracking stats:', error);
    return null;
  }
}

// Function to create a tracking URL with click tracking
function createTrackingUrl(reviewLink, trackingId) {
  // For now, we'll use a simple approach where the tracking ID is embedded in the URL
  // In a production environment, you might want to use a more sophisticated tracking system
  const baseUrl = new URL(reviewLink);
  baseUrl.searchParams.set('tracking', trackingId);
  return baseUrl.toString();
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    markReviewLinkClicked,
    checkAndResendExpiredLinks,
    getTrackingStats,
    createTrackingUrl
  };
}