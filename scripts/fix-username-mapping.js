// Fix username mapping for pnv user
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'ezreview-ee8f0'
});

const db = admin.firestore();

async function fixUsernameMapping() {
  try {
    console.log('🔧 Fixing username mapping for pnv user...');
    
    // Get the pnv user document
    const userDoc = await db.collection('users').doc('pnv').get();
    
    if (!userDoc.exists) {
      console.log('❌ User pnv not found in users collection');
      return;
    }
    
    const userData = userDoc.data();
    console.log('✅ Found user:', userData.email);
    
    // Create username mapping
    await db.collection('usernames').doc('pnv').set({
      uid: userDoc.id,
      email: userData.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Created username mapping: pnv ->', userData.email);
    console.log('🎉 Username mapping fixed! You should now be able to login with "pnv"');
    
  } catch (error) {
    console.error('❌ Error fixing username mapping:', error);
  } finally {
    process.exit(0);
  }
}

fixUsernameMapping();
