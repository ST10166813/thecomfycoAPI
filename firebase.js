const admin = require("firebase-admin");

// Parse JSON from env
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_JSON);

// Replace literal \n with actual newlines
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
