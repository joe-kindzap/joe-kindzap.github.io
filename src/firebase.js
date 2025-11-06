/* File: /src/firebase.js */
/* This file must be inside a folder named "src" in the root directory. */
/* This module handles all communication with Firebase (Auth & Firestore). */
/* --- UPDATED to be "bulletproof" against ad-blockers --- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { FIREBASE_CONFIG } from './config.js';

// --- 1. INITIALIZE ---
// We initialize all Firebase services right away
let auth, db;
try {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // If this fails, the app is fundamentally broken.
}

// --- 2. AUTHENTICATION ---
/**
 * Signs in the user (or returns the existing user).
 * @returns {Promise<string>} The user's UID.
 */
export function signIn() {
  return new Promise((resolve, reject) => {
    if (!auth) return reject(new Error("Firebase Auth is not initialized."));
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // We only need this listener once on startup
      if (user) {
        resolve(user.uid);
      } else {
        // No user, sign one in anonymously
        try {
          const userCredential = await signInAnonymously(auth);
          resolve(userCredential.user.uid);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
          reject(error);
        }
      }
    }, (error) => {
      // This handles errors during the listener setup
      console.error("onAuthStateChanged error:", error);
      reject(error);
    });
  });
}

// --- 3. FIRESTORE (DATABASE) ---
/**
 * Gets the user's configuration from Firestore.
 * If the user is new, it creates a default config for them.
 * @param {string} userId - The user's UID from Auth.
 * @returns {Promise<object|null>} The user's config object or null if failed.
 */
export async function getUserConfig(userId) {
  if (!db) return null; // Return null if DB isn't initialized

  const configRef = doc(db, `users/${userId}/config`, 'main');
  
  try {
    // 1. Try to get the document
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
      // 2a. Returning User: Just return their data
      return docSnap.data();
    } else {
      // 2b. New User: Create a default config
      const defaultConfig = {
        plan: 'free',
        style: Math.random() < 0.5 ? 'witty' : 'wholesome',
        complimentCount: 0,
        assignedAt: serverTimestamp()
      };
      // Try to save this new config
      await setDoc(configRef, defaultConfig);
      // Return the new config
      return defaultConfig;
    }
  } catch (error) {
    // 3. Handle Errors (like an Ad-Blocker!)
    console.error("Error getting user config (likely ad-blocker):", error);
    // Return null to signal to the app that we failed.
    return null;
  }
}

/**
 * Saves a new compliment count to Firestore.
 * @param {string} userId - The user's UID.
 * @param {number} newCount - The new count to save.
 * @returns {Promise<boolean>} True if successful, false if failed.
 */
export async function saveComplimentCount(userId, newCount) {
  if (!db) return false;

  const configRef = doc(db, `users/${userId}/config`, 'main');
  try {
    await setDoc(configRef, { complimentCount: newCount }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving compliment count (likely ad-blocker):", error);
    return false;
  }
}

/**
 * Upgrades the user to "pro" in Firestore.
 * @param {string} userId - The user's UID.
 * @returns {Promise<boolean>} True if successful, false if failed.
 */
export async function saveProPlan(userId) {
  if (!db) return false;
  
  const configRef = doc(db, `users/${userId}/config`, 'main');
  try {
    await setDoc(configRef, { plan: 'pro' }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving pro plan (likely ad-blocker):", error);
    return false;
  }
}
