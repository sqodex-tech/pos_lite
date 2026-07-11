const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app;
if (serviceAccountBase64) {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
    app = initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    console.warn("WARNING: Firebase Admin not initialized. Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env");
    app = initializeApp();
}

module.exports = {
    auth: () => getAuth(app)
};
