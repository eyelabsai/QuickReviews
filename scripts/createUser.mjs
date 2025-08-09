import fs from 'fs';
import path from 'path';
import url from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import admin from 'firebase-admin';

// Usage:
// node scripts/createUser.mjs --email x@y.com --password 'secret' --fullName 'Name' --reviewLink 'https://...'
// Requires service account JSON at ./serviceAccountKey.json

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const serviceKeyPath = path.join(projectRoot, 'serviceAccountKey.json');

if (!fs.existsSync(serviceKeyPath)) {
  console.error('Missing serviceAccountKey.json at project root. Download from Firebase Console > Project settings > Service accounts.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const argv = yargs(hideBin(process.argv))
  .option('email', { type: 'string', demandOption: true })
  .option('password', { type: 'string', demandOption: true })
  .option('fullName', { type: 'string', demandOption: true })
  .option('reviewLink', { type: 'string', demandOption: true })
  .strict()
  .argv;

async function main() {
  const { email, password, fullName, reviewLink } = argv;

  // Create Auth user (idempotent on email)
  let userRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
    console.log(`User exists: ${userRecord.uid}`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await admin.auth().createUser({ email, password, emailVerified: true });
      console.log(`Created user: ${userRecord.uid}`);
    } else {
      throw err;
    }
  }

  // Write Firestore profile (doc can be ID = uid or existing username doc)
  const db = admin.firestore();

  // Try to find existing profile by email; otherwise create new doc with uid
  const qs = await db.collection('users').where('email', '==', email).limit(1).get();
  const docRef = qs.empty ? db.collection('users').doc(userRecord.uid) : qs.docs[0].ref;

  await docRef.set({
    email,
    fullName,
    reviewLink
  }, { merge: true });

  console.log('Profile upserted at:', docRef.path);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
