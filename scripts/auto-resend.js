// Auto-resend script for expired review links
// This script can be run manually or scheduled with cron to check for expired links and resend them

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ezreview-ee8f0'
});

const db = admin.firestore();

async function checkAndResendExpiredLinks() {
  try {
    console.log('🔍 Checking for expired review links...');
    const now = new Date();
    
    // Find all unclicked review links that are older than 3 days
    const expiredLinks = await db.collection('reviewTracking')
      .where('clicked', '==', false)
      .where('expiresAt', '<=', now)
      .where('resendCount', '<', 3) // Limit to 3 resends
      .get();
    
    if (expiredLinks.empty) {
      console.log('✅ No expired review links found to resend.');
      return;
    }
    
    console.log(`📧 Found ${expiredLinks.size} expired links to resend.`);
    
    let resendCount = 0;
    for (const doc of expiredLinks.docs) {
      const tracking = doc.data();
      
      try {
        console.log(`📤 Resending ${tracking.channel} to ${tracking.to} for patient ${tracking.patientFullName}`);
        
        // Generate new tracking URL for the resend
        const trackingUrl = `https://quickreviews-1.web.app/tracking.html?tracking=${doc.id}&link=${encodeURIComponent(tracking.reviewLink)}`;
        
        // Resend the message with updated tracking URL
        if (tracking.channel === 'sms') {
          // Replace any existing tracking URLs or placeholders with new tracking URL
          let resendMessage = tracking.message;
          if (resendMessage.includes('[TRACKING_URL]')) {
            resendMessage = resendMessage.replace('[TRACKING_URL]', trackingUrl);
          } else if (resendMessage.includes('tracking.html?tracking=')) {
            // Replace existing tracking URL
            resendMessage = resendMessage.replace(/https?:\/\/[^\s]+\/tracking\.html\?tracking=[^\s]+/, trackingUrl);
          } else {
            // Append tracking URL if not present
            resendMessage = `${resendMessage}\n\nPlease leave us a review: ${trackingUrl}`;
          }
          
          const smsPayload = {
            to: tracking.to,
            body: resendMessage
          };
          await db.collection("messages").add(smsPayload);
        } else if (tracking.channel === 'email') {
          // For email, use the stored finalHtml if available, otherwise build from message
          let emailHtml = tracking.finalHtml;
          if (!emailHtml) {
            emailHtml = tracking.message.replace(/\n/g, '<br>');
          }
          
          // Replace tracking URLs in HTML
          if (emailHtml.includes('tracking.html?tracking=')) {
            emailHtml = emailHtml.replace(/href="[^"]*tracking\.html\?tracking=[^"]*"/g, `href="${trackingUrl}"`);
          } else {
            // Add tracking link if not present
            emailHtml += `<br><br><a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color: #1e3a8a; text-decoration: underline; font-weight: 500;">Click here to leave a review</a>`;
          }
          
          const mailPayload = {
            to: tracking.to,
            from: 'feedback@ezreviews.app',
            message: {
              subject: `We'd love your feedback! (Reminder)`,
              html: emailHtml
            }
          };
          await db.collection("mail").add(mailPayload);
        }
        
        // Update tracking record
        await doc.ref.update({
          resendCount: admin.firestore.FieldValue.increment(1),
          lastResentAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 1 * 60 * 1000) // Reset expiration (1 minute for testing)
        });
        
        resendCount++;
        console.log(`✅ Successfully resent ${tracking.channel} to ${tracking.to}`);
        
      } catch (error) {
        console.error(`❌ Failed to resend for tracking ID ${doc.id}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully resent ${resendCount} review requests.`);
    
  } catch (error) {
    console.error('❌ Error checking expired links:', error);
    throw error;
  }
}

// Function to get tracking statistics
async function getTrackingStats() {
  try {
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
    
    const stats = {
      total,
      clicked,
      expired,
      dueForResend,
      clickRate: total > 0 ? (clicked / total * 100).toFixed(1) : 0
    };
    
    console.log('📊 Tracking Statistics:');
    console.log(`   Total tracking records: ${stats.total}`);
    console.log(`   Clicked: ${stats.clicked} (${stats.clickRate}%)`);
    console.log(`   Expired unclicked: ${stats.expired}`);
    console.log(`   Due for resend: ${stats.dueForResend}`);
    
    return stats;
  } catch (error) {
    console.error('Failed to get tracking stats:', error);
    return null;
  }
}

// Main execution
async function main() {
  try {
    // Get stats first
    await getTrackingStats();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Check and resend expired links
    await checkAndResendExpiredLinks();
    
    console.log('\n✅ Auto-resend process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Auto-resend process failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkAndResendExpiredLinks,
  getTrackingStats
};