import fs from 'fs';
import path from 'path';
import url from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import admin from 'firebase-admin';

// Usage:
// node scripts/createUser.mjs --email x@y.com --password 'secret' --fullName 'Name' --reviewLink 'https://...'
//   [--username 'name'] [--senderName 'Your Practice'] [--no-sendEmail]
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
  .option('username', { type: 'string', describe: 'Optional username to assign (lowercased, a-z0-9._-)' })
  .option('senderName', { type: 'string', default: 'QuickReviews', describe: 'Friendly From name for welcome email' })
  .option('sendEmail', { type: 'boolean', default: true, describe: 'Send welcome email with reset link' })
  .strict()
  .argv;

async function main() {
  const { email, password, fullName, reviewLink, username, senderName, sendEmail } = argv;

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

  // Write Firestore profile (doc can be ID = uid or existing email doc)
  const db = admin.firestore();

  // Try to find existing profile by email; otherwise create new doc with uid
  const qs = await db.collection('users').where('email', '==', email).limit(1).get();
  const docRef = qs.empty ? db.collection('users').doc(userRecord.uid) : qs.docs[0].ref;

  const profileUpdates = {
    email,
    fullName,
    reviewLink,
    needsPasswordChange: true
  };

  // Assign username if provided; create mapping document
  let finalUsername = null;
  if (username) {
    const desired = String(username).toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(desired)) {
      throw new Error('Invalid --username. Use 3–30 of a-z, 0-9, dot, underscore, hyphen.');
    }
    let candidate = desired;
    // Ensure uniqueness by appending digits if needed
    for (let i = 0; i < 50; i++) {
      const doc = await db.collection('usernames').doc(candidate).get();
      if (!doc.exists) { finalUsername = candidate; break; }
      candidate = `${desired}${Math.floor(1000 + Math.random()*9000)}`;
    }
    if (!finalUsername) throw new Error('Could not assign a unique username after multiple attempts.');
    await db.collection('usernames').doc(finalUsername).set({
      uid: userRecord.uid,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    profileUpdates.username = finalUsername;
    profileUpdates.usernameLower = finalUsername;
  }

  await docRef.set(profileUpdates, { merge: true });

  console.log('Profile upserted at:', docRef.path);

  // Generate a password reset link (safer than sharing raw temp password)
  let resetLink = null;
  try {
    resetLink = await admin.auth().generatePasswordResetLink(email);
    console.log('Password reset link (optional to send to user):');
    console.log(resetLink);
  } catch (e) {
    console.warn('Could not generate password reset link:', e.message);
  }

  // Optionally send welcome/invite email via Firestore mail collection
  if (sendEmail && resetLink) {
    const from = `${senderName} <feedback@ezreviews.app>`;
    const html = `
      <div style="font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;">
        <p>Hi ${fullName.split(' ')[0] || ''},</p>
        <p>Welcome to QuickReviews. Click the link below to set your password and get started:</p>
        <p><a href="${resetLink}">Set your password</a></p>
        ${finalUsername ? `<p>Your username: <b>${finalUsername}</b></p>` : ''}
        <p>Thanks!</p>
      </div>
    `;
    await db.collection('mail').add({
      to: email,
      from,
      message: { subject: 'You are invited to QuickReviews', html }
    });
    console.log('Welcome email enqueued.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
