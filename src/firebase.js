/* File: /src/firebase.js */
/* This file must be inside a folder named "src" in the root directory. */
/* This module handles all communication with Firebase (Auth & Firestore). */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig } from './config.js';

// --- 1. Initialize and Export Services ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- 2. Export Auth Functions ---

/**
 * Sets up the authentication listener.
 * Calls the appropriate callback when the user's auth state changes.
 * @param {function} onUserSignedIn - Callback for when a user is signed in.
 * @param {function} onUserSignedOut - Callback for when a user is signed out.
 */
export function initAuth(onUserSignedIn, onUserSignedOut) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            onUserSignedIn(user);
        } else {
            // No user. We should sign them in anonymously.
            try {
                await signInAnonymously(auth);
                // The onAuthStateChanged listener will fire again with the new user.
            } catch (err) {
                console.error("Anonymous sign-in failed:", err);
                onUserSignedOut(err);
            }
        }
    });
}

// --- 3. Export Firestore (Database) Functions ---

/**
 * Fetches the user's configuration from Firestore.
 * If it doesn't exist, it creates a new one.
 * @param {string} userId - The user's Firebase UID.
 * @returns {object} The user's configuration data.
 */
export async function fetchUserConfig(userId) {
    const configRef = doc(db, `users/${userId}/config`, 'main');
    const docSnap = await getDoc(configRef);

    if (docSnap.exists()) {
        // --- Returning User ---
        return docSnap.data();
    } else {
        // --- New User ---
        const newConfig = {
            plan: 'free',
            style: Math.random() < 0.5 ? 'witty' : 'wholesome',
            complimentCount: 0,
            assignedAt: serverTimestamp()
        };
        await setDoc(configRef, newConfig);
        return newConfig;
    }
}

/**
 * Updates the user's plan to "pro" in Firestore.
 * @param {string} userId - The user's Firebase UID.
 */
export async function updateUserPlan(userId) {
    const configRef = doc(db, `users/${userId}/config`, 'main');
    await setDoc(configRef, { plan: 'pro' }, { merge: true });
}

/**
 * Increments the user's compliment count in Firestore.
 * @param {string} userId - The user's Firebase UID.
 * @param {number} newCount - The user's new compliment count.
 */
export async function incrementComplimentCount(userId, newCount) {
    const configRef = doc(db, `users/${userId}/config`, 'main');
    await setDoc(configRef, { complimentCount: newCount }, { merge: true });
}
