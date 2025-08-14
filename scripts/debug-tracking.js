// Debug script to test tracking record creation manually
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ezreview-ee8f0'
});

const db = admin.firestore();

async function debugTrackingCreation() {
  console.log('🔍 Testing tracking record creation...');
  
  try {
    // Test creating a tracking record like the dashboard would
    const testRecord = {
      ownerEmail: 'gurpal.virdi@gmail.com', // Your email
      patientFullName: 'Debug Test Patient',
      patientPreferredName: 'Debug',
      to: '+16503849262',
      channel: 'sms',
      reviewLink: 'https://g.page/r/test-link', // Test link
      message: 'Hi Debug! Please leave us a review: [TRACKING_URL]',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 1 * 60 * 1000), // 1 minute
      clicked: false,
      clickCount: 0,
      resendCount: 0,
      lastResentAt: null
    };
    
    console.log('📝 Creating test tracking record...');
    const trackingRef = await db.collection('reviewTracking').add(testRecord);
    console.log(`✅ Created tracking record: ${trackingRef.id}`);
    
    // Generate tracking URL
    const trackingUrl = `https://quickreviews-1.web.app/tracking.html?tracking=${trackingRef.id}&link=${encodeURIComponent(testRecord.reviewLink)}`;
    console.log(`🔗 Tracking URL: ${trackingUrl}`);
    
    // Update with final message
    const finalMessage = testRecord.message.replace('[TRACKING_URL]', trackingUrl);
    await trackingRef.update({
      finalMessage: finalMessage
    });
    
    console.log(`📝 Final message: ${finalMessage}`);
    console.log('✅ Test completed successfully!');
    
    // Clean up
    await trackingRef.delete();
    console.log('🧹 Test record deleted');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugTrackingCreation();
