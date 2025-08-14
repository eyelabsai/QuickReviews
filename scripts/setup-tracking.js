// Setup script for review tracking system
// This script helps verify the configuration and set up necessary collections

const admin = require('firebase-admin');

console.log('🔧 Review Tracking System Setup\n');

// Check if service account file exists
let serviceAccount;
try {
  serviceAccount = require('../serviceAccountKey.json');
  console.log('✅ serviceAccountKey.json found');
} catch (error) {
  console.error('❌ serviceAccountKey.json not found in project root');
  console.log('\n📋 To fix this:');
  console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('   2. Click "Generate new private key"');
  console.log('   3. Download the JSON file');
  console.log('   4. Place it in your project root as "serviceAccountKey.json"');
  process.exit(1);
}

// Verify service account has required fields
const requiredFields = ['project_id', 'private_key', 'client_email'];
const missingFields = requiredFields.filter(field => !serviceAccount[field]);

if (missingFields.length > 0) {
  console.error(`❌ serviceAccountKey.json is missing required fields: ${missingFields.join(', ')}`);
  process.exit(1);
}

console.log(`✅ Service account configuration looks good`);
console.log(`   Project ID: ${serviceAccount.project_id}`);
console.log(`   Client Email: ${serviceAccount.client_email}`);

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  process.exit(1);
}

const db = admin.firestore();

async function verifyFirestoreAccess() {
  try {
    console.log('\n🔌 Testing Firestore access...');
    
    // Test read access
    await db.collection('reviewTracking').limit(1).get();
    console.log('✅ Read access to reviewTracking collection');
    
    // Test write access
    const testDoc = await db.collection('reviewTracking').add({
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Write access to reviewTracking collection');
    
    // Clean up test document
    await testDoc.delete();
    console.log('✅ Delete access to reviewTracking collection');
    
    return true;
  } catch (error) {
    console.error('❌ Firestore access test failed:', error.message);
    
    if (error.code === 'PERMISSION_DENIED') {
      console.log('\n🔐 Permission Error - Solutions:');
      console.log('   1. Check Firestore security rules');
      console.log('   2. Verify service account has proper permissions');
      console.log('   3. Ensure the collection exists or can be created');
    }
    
    return false;
  }
}

async function checkExistingCollections() {
  try {
    console.log('\n📚 Checking existing collections...');
    
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    console.log('Available collections:');
    collectionNames.forEach(name => {
      console.log(`   - ${name}`);
    });
    
    if (collectionNames.includes('reviewTracking')) {
      console.log('\n✅ reviewTracking collection already exists');
    } else {
      console.log('\n⚠️  reviewTracking collection does not exist yet');
      console.log('   It will be created automatically when you send your first review request');
    }
    
    return collectionNames;
  } catch (error) {
    console.error('❌ Failed to check collections:', error.message);
    return [];
  }
}

async function main() {
  try {
    console.log('🚀 Starting setup verification...\n');
    
    // Verify Firestore access
    const hasAccess = await verifyFirestoreAccess();
    if (!hasAccess) {
      console.log('\n❌ Setup failed - cannot access Firestore');
      process.exit(1);
    }
    
    // Check existing collections
    await checkExistingCollections();
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Setup verification completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run the test script: node test-tracking-fixed.js');
    console.log('   2. Or test through your dashboard by sending a review request');
    console.log('   3. Check Firebase Console to see tracking records');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  verifyFirestoreAccess,
  checkExistingCollections
};