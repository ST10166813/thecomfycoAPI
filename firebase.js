const admin = require('firebase-admin');

// Parse JSON from env
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);

// Convert escaped \n to real newlines
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
