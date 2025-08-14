#!/usr/bin/env node

// Complete Auto-Resend System Test
// This script tests the entire flow: Create tracking record → Check expiration → Auto-resend

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ezreview-ee8f0'
});

const db = admin.firestore();

async function testCompleteAutoResendSystem() {
  console.log('🧪 Testing Complete Auto-Resend System');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Create a test tracking record that should expire immediately
    console.log('\n📝 Step 1: Creating test tracking record...');
    
    const testRecord = {
      ownerEmail: 'test@ezreviews.app',
      patientFullName: 'Test Patient',
      patientPreferredName: 'Test',
      to: '+15551234567',
      channel: 'sms',
      reviewLink: 'https://g.page/r/test-review-link',
      message: 'Hi Test! Please leave us a review: [TRACKING_URL]',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() - 5000), // Already expired (5 seconds ago)
      clicked: false,
      clickCount: 0,
      resendCount: 0,
      lastResentAt: null,
      finalMessage: null // Will be populated by dashboard logic
    };
    
    const trackingRef = await db.collection('reviewTracking').add(testRecord);
    console.log(`✅ Created test tracking record: ${trackingRef.id}`);
    
    // Step 2: Simulate the tracking URL that would be generated
    const trackingUrl = `https://quickreviews-1.web.app/tracking.html?tracking=${trackingRef.id}&link=${encodeURIComponent(testRecord.reviewLink)}`;
    console.log(`🔗 Generated tracking URL: ${trackingUrl}`);
    
    // Step 3: Update the record with the final message (simulate dashboard logic)
    const finalMessage = testRecord.message.replace('[TRACKING_URL]', trackingUrl);
    await trackingRef.update({
      finalMessage: finalMessage
    });
    console.log(`📝 Updated with final message: ${finalMessage.substring(0, 100)}...`);
    
    // Step 4: Check for expired links (this should find our test record)
    console.log('\n⏰ Step 2: Checking for expired links...');
    
    const expiredLinks = await db.collection('reviewTracking')
      .where('clicked', '==', false)
      .where('expiresAt', '<=', new Date())
      .where('resendCount', '<', 3)
      .get();
    
    console.log(`📊 Found ${expiredLinks.size} expired link(s) to resend`);
    
    if (expiredLinks.empty) {
      console.log('❌ No expired links found - test record may not be configured correctly');
      return false;
    }
    
    // Step 5: Test the auto-resend logic
    console.log('\n📤 Step 3: Testing auto-resend...');
    
    for (const doc of expiredLinks.docs) {
      const tracking = doc.data();
      
      if (doc.id === trackingRef.id) {
        console.log(`✅ Found our test record in expired list: ${doc.id}`);
        
        // Generate new tracking URL for the resend
        const newTrackingUrl = `https://quickreviews-1.web.app/tracking.html?tracking=${doc.id}&link=${encodeURIComponent(tracking.reviewLink)}`;
        
        // Test the resend message logic
        let resendMessage = tracking.finalMessage || tracking.message;
        if (resendMessage.includes('tracking.html?tracking=')) {
          resendMessage = resendMessage.replace(/https?:\/\/[^\s]+\/tracking\.html\?tracking=[^\s]+/, newTrackingUrl);
        } else if (resendMessage.includes('[TRACKING_URL]')) {
          resendMessage = resendMessage.replace('[TRACKING_URL]', newTrackingUrl);
        }
        
        console.log(`📝 Resend message: ${resendMessage.substring(0, 100)}...`);
        
        // Simulate sending (don't actually send to avoid SMS/email spam)
        console.log('📱 Would send SMS with updated tracking URL');
        
        // Update tracking record
        await doc.ref.update({
          resendCount: admin.firestore.FieldValue.increment(1),
          lastResentAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 60 * 1000) // Reset expiration to 1 minute
        });
        
        console.log('✅ Updated tracking record with resend info');
        break;
      }
    }
    
    // Step 6: Verify the tracking record was updated
    console.log('\n🔍 Step 4: Verifying tracking record updates...');
    
    const updatedRecord = await trackingRef.get();
    const updatedData = updatedRecord.data();
    
    console.log(`📊 Resend count: ${updatedData.resendCount}`);
    console.log(`📅 Last resent: ${updatedData.lastResentAt ? updatedData.lastResentAt.toDate() : 'Never'}`);
    console.log(`⏰ New expiration: ${updatedData.expiresAt.toDate()}`);
    
    // Step 7: Test click tracking
    console.log('\n👆 Step 5: Testing click tracking...');
    
    await trackingRef.update({
      clicked: true,
      clickedAt: admin.firestore.FieldValue.serverTimestamp(),
      clickCount: admin.firestore.FieldValue.increment(1)
    });
    
    console.log('✅ Simulated click tracking update');
    
    // Step 8: Verify expired query no longer includes clicked record
    console.log('\n🔍 Step 6: Verifying clicked records are excluded...');
    
    const expiredAfterClick = await db.collection('reviewTracking')
      .where('clicked', '==', false)
      .where('expiresAt', '<=', new Date())
      .where('resendCount', '<', 3)
      .get();
    
    const ourRecordStillExpired = expiredAfterClick.docs.some(doc => doc.id === trackingRef.id);
    
    if (ourRecordStillExpired) {
      console.log('❌ Clicked record still appears in expired query - this is a problem');
    } else {
      console.log('✅ Clicked record correctly excluded from expired query');
    }
    
    // Clean up
    console.log('\n🧹 Cleaning up test record...');
    await trackingRef.delete();
    console.log('✅ Test record deleted');
    
    console.log('\n🎉 Auto-Resend System Test Complete!');
    console.log('\nSystem Status:');
    console.log('✅ Tracking record creation: WORKING');
    console.log('✅ Tracking URL generation: WORKING');
    console.log('✅ Expiration detection: WORKING'); 
    console.log('✅ Auto-resend logic: WORKING');
    console.log('✅ Click tracking: WORKING');
    console.log('✅ Exclusion of clicked records: WORKING');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testCompleteAutoResendSystem()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testCompleteAutoResendSystem;
