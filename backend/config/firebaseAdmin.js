const fs = require("fs");
const path = require("path");
const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!getApps().length) {
  if (!serviceAccountPath) {
    console.warn(
      "Firebase Admin SDK is NOT initialized: FIREBASE_SERVICE_ACCOUNT_PATH is not set in the environment. " +
        "Add FIREBASE_SERVICE_ACCOUNT_PATH=<path> to .env and place your service account JSON there."
    );
  } else if (!fs.existsSync(serviceAccountPath)) {
    console.warn(
      `Firebase Admin SDK is NOT initialized: the service account file at "${serviceAccountPath}" does not exist. ` +
        "Download it from Firebase Console > Project settings > Service accounts > Generate new private key and save it as backend/serviceAccountKey.json."
    );
  } else {
    try {
      const resolvedPath = path.resolve(serviceAccountPath);
      const raw = fs.readFileSync(resolvedPath, "utf8").replace(/^\uFEFF/, "");
      const serviceAccount = JSON.parse(raw);
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized");
    } catch (error) {
      console.warn(
        `Failed to initialize Firebase Admin SDK from "${serviceAccountPath}": ${error.message}. ` +
          "Firebase login (POST /api/auth/firebase-login) will return an error until a valid service account JSON is provided."
      );
    }
  }
}

module.exports = { getAuth, getApps };