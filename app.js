/* File: /app.js */
/* This file should be in the root directory, alongside index.html. */
/* This ONE file contains ALL of our frontend JavaScript logic. */

// --- 1. IMPORTS (Firebase) ---
// We import these at the top, just as we did in the single-file version.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- 2. CONFIGURATION ---

// These are your personal keys from your Firebase project.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDwU2ezZgJKxVLBwD4FA7odorpzIHwPklI",
  authDomain: "kindzap-project.firebaseapp.com",
  projectId: "kindzap-project",
  storageBucket: "kindzap-project.firebasestorage.app",
  messagingSenderId: "1097934782133",
  appId: "1:1097934782133:web:9d8faa8c992366a8ef08fc"
};

// This object holds the different "personalities" for our AI.
const PROMPTS = {
    witty: "You are a witty, slightly sarcastic, but ultimately very supportive friend. Generate a compliment that is clever and funny, based on the user's input.",
    wholesome: "You are a warm, empathetic, and wholesome friend. Generate a sincere, kind, and uplifting compliment based on the user's input. Be very encouraging.",
    shakespeare: "You are Shakespeare. Generate a compliment in elegant, flowery, iambic-pentameter-style prose based on the user's input. Use words like 'thou', 'hath', and 'verily'.",
    gen_z: "You are a Gen Z TikToker. Generate a compliment that is 'for the moment' based on the user's input. Use modern slang. No cap, make it hit different. Bet.",
    business: "You are a business professional in a suit. Generate a compliment that sounds like corporate buzzwords. Synergize the user's input into a value-add statement."
};

// --- 3. DOM ELEMENTS ---
// We grab all our HTML elements by their ID so we can control them.
const authStatus = document.getElementById('auth-status');
const styleStatus = document.getElementById('style-status');
const generateBtn = document.getElementById('generate-btn');
const btnSpinner = document.getElementById('btn-spinner');
const btnText = document.getElementById('btn-text');
const userInput = document.getElementById('user-input');
const outputContainer = document.getElementById('output-container');
const outputText = document.getElementById('output-text');
const paywall = document.getElementById('paywall');
const closePaywallBtn = document.getElementById('close-paywall-btn');
const upgradeBtn = document.getElementById('upgrade-btn');
const styleSelector = document.getElementById('style-selector');

// --- 4. FIREBASE & APP INITIALIZATION ---
let auth, db;
try {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  authStatus.textContent = "Error: App failed to load.";
  styleStatus.textContent = "Please refresh the page.";
}

// --- 5. GLOBAL STATE ---
// This object holds our app's "memory" while the user is on the page.
const state = {
  isLoading: false,
  userId: null,
  userPlan: 'free',
  userStyle: 'witty',
  complimentCount: 0,
};

// --- 6. CORE APP LOGIC ---

/**
 * Signs in the user (or returns the existing user).
 * This is the first thing that runs.
 */
function signIn() {
  return new Promise((resolve, reject) => {
    if (!auth) return reject(new Error("Firebase Auth is not initialized."));
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // We only need this listener once on startup
      if (user) {
        resolve(user.uid);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          resolve(userCredential.user.uid);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
          reject(error);
        }
      }
    }, (error) => {
      console.error("onAuthStateChanged error:", error);
      reject(error);
    });
  });
}

/**
 * Gets the user's configuration from Firestore.
 * If new, it creates a default config for them.
 */
async function getUserConfig(userId) {
  if (!db) return null; 

  const configRef = doc(db, `users/${userId}/config`, 'main');
  
  try {
    const docSnap = await getDoc(configRef);
    if (docSnap.exists()) {
      return docSnap.data(); // Returning User
    } else {
      // New User: Create a default config
      const defaultConfig = {
        plan: 'free',
        style: Math.random() < 0.5 ? 'witty' : 'wholesome',
        complimentCount: 0,
        assignedAt: serverTimestamp()
      };
      await setDoc(configRef, defaultConfig);
      return defaultConfig;
    }
  } catch (error) {
    // Handle Errors (like an Ad-Blocker!)
    console.error("Error getting user config (likely ad-blocker):", error);
    return null; // Return null to signal to the app that we failed.
  }
}

/**
 * *** FIX: Renamed this function from initializeApp to startApp ***
 * The main "boot-up" function for the app.
 */
async function startApp() {
  try {
    // 1. Sign in
    updateAuthStatus(`Connecting...`);
    state.userId = await signIn();
    updateAuthStatus(`Your User ID: ${state.userId.substring(0, 8)}...`);
    posthog.identify(state.userId);

    // 2. Get user data
    const config = await getUserConfig(state.userId);

    // 3. Handle Ad-Blocker (if config is null)
    if (config === null) {
      state.userPlan = 'free';
      state.userStyle = 'witty';
      state.complimentCount = 0;
      updateStatus("Warning: Could not load user plan (ad-blocker?).");
      
      // Check for PostHog function before calling
      if (posthog.people && typeof posthog.people.set === 'function') {
        posthog.people.set({ plan: 'free', assigned_style: 'witty' });
      }
    } else {
      // 4. Load real config
      state.userPlan = config.plan;
      state.userStyle = config.style;
      state.complimentCount = config.complimentCount || 0;
      updateStatus();
      
      // Check for PostHog function before calling
      if (posthog.people && typeof posthog.people.set === 'function') {
         posthog.people.set({
           plan: state.userPlan,
           assigned_style: state.userStyle
         });
      }
    }
    
    // 5. Unlock the UI
    unlockProFeatures(state.userPlan);
    styleSelector.value = state.userStyle;
    setLoading(false); // This enables the button

  } catch (error) {
    console.error("Error initializing app:", error);
    updateAuthStatus("Error: App failed to load.");
    updateStatus("Critical error. Please refresh.");
    setLoading(true); // Keep button disabled
  }
}

/**
 * Handles the "Get Compliment" button click.
 */
async function handleComplimentRequest() {
  if (state.isLoading) return;

  // 1. Check for paywall
  if (state.userPlan === 'free' && state.complimentCount >= 3) {
    showPaywall(true);
    posthog.capture('paywall_viewed');
    return;
  }

  const query = userInput.value.trim();
  if (!query) {
    showResult("Please tell me a little something first!");
    return;
  }

  setLoading(true);
  const selectedStyle = styleSelector.value;
  const systemPrompt = PROMPTS[selectedStyle];

  try {
    // 2. Call our Vercel backend
    const compliment = await callVercelApi(query, systemPrompt);
    showResult(compliment);

    // 3. Capture PostHog event
    posthog.capture('compliment_generated', {
      style: selectedStyle,
      plan: state.userPlan,
      query_length: query.length
    });

    // 4. Update and save the count (if free user)
    if (state.userPlan === 'free') {
      state.complimentCount++;
      updateStatus();
      await saveComplimentCount(state.userId, state.complimentCount);
    }
  } catch (error) {
    console.error("Error from handleComplimentRequest:", error);
    showResult(`Sorry, an error occurred: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

/**
 * Handles the "Upgrade Now" button click.
 */
async function handleUpgradeRequest() {
  setUpgradeLoading(true);

  try {
    // 1. Save "pro" status to Firebase
    const success = await saveProPlan(state.userId);

    if (success) {
      state.userPlan = 'pro';
      updateStatus();
      unlockProFeatures(state.userPlan);
      showPaywall(false);

      // 4. Capture PostHog event
      posthog.capture('upgrade_success', { new_plan: 'pro' });
      if (posthog.people && typeof posthog.people.set === 'function') {
        posthog.people.set({ plan: 'pro' });
      }

    } else {
      throw new Error("Database update failed. Please check your connection or ad-blocker.");
    }
  } catch (error) {
    console.error("Error upgrading plan:", error);
    setUpgradeLoading(false, `Error: ${error.message}`);
  }
}

/**
 * This is the *frontend* service that calls our Vercel backend.
 */
async function callVercelApi(userQuery, systemPrompt) {
    const payload = { userQuery, systemPrompt };

    try {
        const response = await fetch('/api/getCompliment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Server API Error: ${errorBody.error || response.statusText}`);
        }

        const result = await response.json();
        return result.compliment; // Success!

    } catch (error) {
        console.error("Error from callVercelApi:", error);
        throw error; // Re-throw the error so the main app can handle it
    }
}

// --- 7. DATABASE HELPER FUNCTIONS ---

/**
 * Saves a new compliment count to Firestore.
 */
async function saveComplimentCount(userId, newCount) {
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
 */
async function saveProPlan(userId) {
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

// --- 8. DOM/UI HELPER FUNCTIONS ---

/**
 * Manages the loading state of the main button.
 */
function setLoading(isLoading) {
    state.isLoading = isLoading;
    generateBtn.disabled = isLoading;
    if (isLoading) {
        btnSpinner.classList.remove('hidden');
        btnText.textContent = "Generating...";
    } else {
        btnSpinner.classList.add('hidden');
        btnText.textContent = "Get Compliment";
    }
}

/**
 * Manages the loading state of the upgrade button.
 */
function setUpgradeLoading(isLoading, errorText = null) {
    upgradeBtn.disabled = isLoading;
    if (errorText) {
        upgradeBtn.textContent = errorText;
        // Reset after a moment
        setTimeout(() => {
            upgradeBtn.disabled = false;
            upgradeBtn.textContent = "Upgrade Now ($5/mo)";
        }, 3000);
    } else if (isLoading) {
        upgradeBtn.textContent = "Processing payment...";
    } else {
        upgradeBtn.textContent = "Upgrade Now ($5/mo)";
    }
}

/**
 * Shows or hides the paywall modal.
 */
function showPaywall(show) {
    if (show) {
        paywall.classList.remove('hidden');
    } else {
        paywall.classList.add('hidden');
    }
}

/**
 * Updates the auth status text.
 */
function updateAuthStatus(text) {
    authStatus.textContent = text;
}

/**
 * Updates the style/plan status text.
 */
function updateStatus(warning = null) {
    if (warning) {
        styleStatus.textContent = warning;
    } else {
        const { userStyle, userPlan, complimentCount } = state;
        styleStatus.textContent = `Style: ${userStyle} (Plan: ${userPlan}) (Count: ${complimentCount})`;
    }
}

/**
 * Unlocks pro features in the dropdown.
 */
function unlockProFeatures(plan) {
    if (plan !== 'pro') return;
    styleSelector.querySelectorAll('option').forEach(option => {
        if (['shakespeare', 'gen_z', 'business'].includes(option.value)) {
            option.disabled = false;
        }
    });
}

/**
 * Displays the result in the output box.
 */
function showResult(text) {
    outputText.textContent = text;
    outputContainer.classList.remove('hidden');
}


// --- 9. START THE APP ---
// Add all event listeners
generateBtn.addEventListener('click', handleComplimentRequest);
upgradeBtn.addEventListener('click', handleUpgradeRequest);
closePaywallBtn.addEventListener('click', () => showPaywall(false));

// *** FIX: Call our renamed startApp function ***
startApp();
