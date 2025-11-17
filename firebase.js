const admin = require("firebase-admin");

// Parse the JSON from the environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log("✅ Firebase Admin initialized successfully");

module.exports = admin;
