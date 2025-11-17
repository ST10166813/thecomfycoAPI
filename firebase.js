const admin = require("firebase-admin");

// Parse the JSON string from the env
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);

// Replace the escaped \n with real newlines
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
