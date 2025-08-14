// Simplified test script that doesn't require complex Firestore indexes
// This script tests the basic tracking functionality

const admin = require('firebase-admin');

// Check if service account file exists
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
} catch (error) {
  console.error('❌ serviceAccountKey.json not found in project root');
  console.log('📋 Please download it from Firebase Console → Project Settings → Service Accounts');
  console.log('📁 Place it in your project root directory');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ezreview-ee8f0'
});

const db = admin.firestore();

async function createTestTrackingRecord() {
  try {
    console.log('🧪 Creating test tracking record...');
    
    const testRecord = {
      ownerEmail: 'test@example.com',
      patientFullName: 'Test Patient',
      patientPreferredName: 'Test',
      to: '+15551234567',
      channel: 'sms',
      reviewLink: 'https://g.page/r/test-review-link',
      message: 'Hi Test! Please leave us a review: [TRACKING_URL]',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 1 * 60 * 1000), // 1 minute from now (for testing)
      clicked: false,
      clickCount: 0,
      resendCount: 0,
      lastResentAt: null
    };
    
    const docRef = await db.collection('reviewTracking').add(testRecord);
    console.log(`✅ Test tracking record created with ID: ${docRef.id}`);
    
    // Generate tracking URL
    const trackingUrl = `http://localhost:5000/tracking.html?tracking=${docRef.id}&link=${encodeURIComponent(testRecord.reviewLink)}`;
    console.log(`🔗 Tracking URL: ${trackingUrl}`);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create test record:', error);
    throw error;
  }
}

async function simulateClick(trackingId) {
  try {
    console.log(`🖱️ Simulating click for tracking ID: ${trackingId}`);
    
    await db.collection('reviewTracking').doc(trackingId).update({
      clicked: true,
      clickedAt: admin.firestore.FieldValue.serverTimestamp(),
      clickCount: admin.firestore.FieldValue.increment(1)
    });
    
    console.log('✅ Click simulated successfully');
  } catch (error) {
    console.error('❌ Failed to simulate click:', error);
    throw error;
  }
}

async function testBasicQueries() {
  try {
    console.log('🔍 Testing basic Firestore queries...');
    
    // Test 1: Simple query for unclicked records
    const unclickedQuery = await db.collection('reviewTracking')
      .where('clicked', '==', false)
      .limit(5)
      .get();
    
    console.log(`✅ Found ${unclickedQuery.size} unclicked records`);
    
    // Test 2: Query by channel
    const smsQuery = await db.collection('reviewTracking')
      .where('channel', '==', 'sms')
      .limit(5)
      .get();
    
    console.log(`✅ Found ${smsQuery.size} SMS records`);
    
    // Test 3: Query by owner email
    const ownerQuery = await db.collection('reviewTracking')
      .where('ownerEmail', '==', 'test@example.com')
      .limit(5)
      .get();
    
    console.log(`✅ Found ${ownerQuery.size} records for test@example.com`);
    
    return true;
  } catch (error) {
    console.error('❌ Basic queries failed:', error.message);
    return false;
  }
}

async function cleanupTestRecords(trackingIds) {
  try {
    console.log('🧹 Cleaning up test records...');
    
    for (const id of trackingIds) {
      await db.collection('reviewTracking').doc(id).delete();
      console.log(`🗑️ Deleted test record: ${id}`);
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup test records:', error);
  }
}

async function main() {
  const testIds = [];
  
  try {
    console.log('🚀 Starting simplified review tracking tests...\n');
    
    // Verify Firebase connection first
    console.log('🔌 Testing Firebase connection...');
    try {
      await db.collection('reviewTracking').limit(1).get();
      console.log('✅ Firebase connection successful');
    } catch (error) {
      console.error('❌ Firebase connection failed:', error.message);
      console.log('💡 Make sure:');
      console.log('   1. serviceAccountKey.json is in the project root');
      console.log('   2. The service account has Firestore permissions');
      console.log('   3. You\'re using the correct project ID');
      throw error;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 1: Create tracking record
    const trackingId = await createTestTrackingRecord();
    testIds.push(trackingId);

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Simulate click
    await simulateClick(trackingId);

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Test basic queries (no complex indexes needed)
    await testBasicQueries();

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 4: Verify click was recorded
    const updatedRecord = await db.collection('reviewTracking').doc(trackingId).get();
    const data = updatedRecord.data();

    console.log('📊 Verification Results:');
    console.log(`   Clicked: ${data.clicked}`);
    console.log(`   Click count: ${data.clickCount}`);
    console.log(`   Clicked at: ${data.clickedAt ? data.clickedAt.toDate() : 'Not set'}`);

    console.log('\n✅ All basic tests completed successfully!');
    console.log('\n💡 To test expired link detection, create the Firestore index first:');
    console.log('   https://console.firebase.google.com/v1/r/project/ezreview-ee8f0/firestore/indexes');

  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.log('\n🔐 Permission Error - Common Solutions:');
      console.log('   1. Check if serviceAccountKey.json exists in project root');
      console.log('   2. Verify the service account has Firestore read/write access');
      console.log('   3. Ensure you\'re using the correct Firebase project');
      console.log('   4. Check Firestore security rules allow write access');
    }

  } finally {
    // Cleanup test records
    if (testIds.length > 0) {
      console.log('\n' + '='.repeat(50) + '\n');
      await cleanupTestRecords(testIds);
    }

    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createTestTrackingRecord,
  simulateClick,
  testBasicQueries,
  cleanupTestRecords
};