const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

const accountSid = functions.config().twilio.sid;
const authToken = functions.config().twilio.token;
const messagingServiceSid = functions.config().twilio.messaging_service_sid;

const client = new twilio(accountSid, authToken);

// Trigger when a new message is added to Firestore
exports.sendSmsOnMessageCreate = functions.firestore
  .document("messages/{messageId}")
  .onCreate((snap, context) => {
    const data = snap.data();
    const phoneNumber = data.to;
    const messageBody = data.body;

    return client.messages.create({
      body: messageBody,
      to: phoneNumber,
      messagingServiceSid: messagingServiceSid,
    })
    .then((message) => {
      console.log("SMS sent: ", message.sid);
      return snap.ref.update({ status: "sent", messageSid: message.sid });
    })
    .catch((error) => {
      console.error("SMS failed: ", error);
      return snap.ref.update({ status: "error", errorMessage: error.message });
    });
  });

