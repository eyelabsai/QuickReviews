const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.autoResendReviewRequests = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async () => {
    try {
      console.log('🔄 Starting auto-resend process...');

      const db = admin.firestore();
      const now = new Date();

      // Optional: limit max automatic resends
      const expiredLinks = await db.collection('reviewTracking')
        .where('clicked', '==', false)
        .where('expiresAt', '<=', now)
        .get();

      console.log(`📧 Found ${expiredLinks.size} expired links to resend.`);

      let resendCount = 0;

      const host = process.env.TRACKING_HOST || 'https://ezreview-ee8f0.web.app';

      for (const doc of expiredLinks.docs) {
        const tracking = doc.data();

        try {
          const trackingUrl = `${host}/tracking.html?tracking=${doc.id}&link=${encodeURIComponent(tracking.reviewLink)}`;

          if (tracking.channel === 'sms') {
            // Build SMS payload with updated tracking URL
            let resendMessage = tracking.finalMessage || tracking.message || '';
            if (resendMessage.includes('[TRACKING_URL]')) {
              resendMessage = resendMessage.replace('[TRACKING_URL]', trackingUrl);
            } else if (resendMessage.includes('tracking.html?tracking=')) {
              resendMessage = resendMessage.replace(/https?:\/\/[^\s]+\/tracking\.html\?tracking=[^\s]+/, trackingUrl);
            } else {
              resendMessage = `${resendMessage}\n\nPlease leave us a review: ${trackingUrl}`;
            }

            const smsPayload = { to: tracking.to, body: resendMessage };
            await db.collection('messages').add(smsPayload);
            console.log(`📤 Queued SMS resend to ${tracking.to}`);

          } else if (tracking.channel === 'email') {
            // Prepare email HTML
            let emailHtml = tracking.finalHtml || (tracking.message || '').replace(/\n/g, '<br>');
            
            // Fix duplicated greeting names in reminder emails
            if (emailHtml.includes('Hi ') || emailHtml.includes('Hello ') || emailHtml.includes('Hey ')) {
              // Replace duplicated names like "Hi NAME, NAME!" with "Hi NAME!"
              emailHtml = emailHtml.replace(/(Hi|Hello|Hey)\s+([^<>\n,]+),\s+\1\s+([^<>\n,]+)/gi, '$1 $2');
              // Also fix single greeting with comma: "Hi NAME," -> "Hi NAME!"
              emailHtml = emailHtml.replace(/(Hi|Hello|Hey)\s+([^<>\n,]+),/gi, '$1 $2!');
            }
            
            if (emailHtml.includes('tracking.html?tracking=')) {
              emailHtml = emailHtml.replace(/href="[^"]*tracking\.html\?tracking=[^"]*"/g, `href="${trackingUrl}"`);
            } else {
              emailHtml += `<br><br><a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" style="color: #1e3a8a; text-decoration: underline; font-weight: 500;">Click here to leave a review</a>`;
            }

            const fromName = (tracking.senderName || '').trim();
            const from = fromName ? `${fromName} <feedback@ezreviews.app>` : 'feedback@ezreviews.app';
            const mailPayload = {
              to: tracking.to,
              from,
              message: {
                subject: `We'd love your feedback! (Reminder)`,
                html: emailHtml
              }
            };
            await db.collection('mail').add(mailPayload);
            console.log(`📤 Queued email resend to ${tracking.to}`);
          }

          // Update tracking record for next cycle
          await doc.ref.update({
            resendCount: admin.firestore.FieldValue.increment(1),
            lastResentAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 1 * 60 * 1000) // reset 1 minute (adjust for prod)
          });

          resendCount++;
        } catch (error) {
          console.error(`❌ Failed to resend for tracking ID ${doc.id}:`, error);
        }
      }

      console.log(`🎉 Successfully processed ${resendCount} resends.`);
      return { success: true, resendCount };
    } catch (error) {
      console.error('❌ Auto-resend failed:', error);
      throw error;
    }
  });
