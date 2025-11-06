/* File: /app.js */
/* This is the main JavaScript controller, placed in the root directory. */
/* It's the "brain" of the application and coordinates all other modules. */
/* --- UPDATED to be "bulletproof" against ad-blockers --- */

// --- 1. IMPORTS ---
import { PROMPTS } from './src/config.js';
import * as dom from './src/dom.js';
import * as firebase from './src/firebase.js';
import * as api from './src/api.js';

// --- 2. GLOBAL STATE ---
// We initialize a default state, so the app is stable
// even if Firebase fails to load.
const state = {
  isLoading: false,
  userId: null,
  userPlan: 'free',
  userStyle: 'witty',
  complimentCount: 0,
};

// --- 3. MAIN APP "BOOT" FUNCTION ---
/**
 * Initializes the entire application on page load.
 */
async function initializeApp() {
  try {
    // 1. Sign in the user (Auth)
    dom.updateAuthStatus(`Connecting...`);
    state.userId = await firebase.signIn();
    dom.updateAuthStatus(`Your User ID: ${state.userId.substring(0, 8)}...`);
    posthog.identify(state.userId);

    // 2. Get user data (Firestore)
    const config = await firebase.getUserConfig(state.userId);

    // 3. --- NEW: DEFENSIVE CHECK ---
    // Check if the config failed (e.g., ad-blocker)
    if (config === null) {
      // Firestore failed. Use default state and show a warning.
      state.userPlan = 'free';
      state.userStyle = 'witty';
      state.complimentCount = 0;
      // Show a non-blocking error to the user
      dom.updateStatus(state, "Warning: Could not load user plan (ad-blocker?).");
      posthog.people.set({ plan: 'free', assigned_style: 'witty' });
    } else {
      // 4. Firestore Succeeded: Load the real config
      state.userPlan = config.plan;
      state.userStyle = config.style;
      state.complimentCount = config.complimentCount || 0; // Ensure count is not undefined
      dom.updateStatus(state);
      // Update PostHog with the real data
      if (posthog.people && typeof posthog.people.set === 'function') {
         posthog.people.set({
           plan: state.userPlan,
           assigned_style: state.userStyle
         });
      }
    }
    
    // 5. Unlock the UI
    dom.unlockProFeatures(state.userPlan);
    dom.styleSelector.value = state.userStyle;
    dom.setLoading(false); // This enables the button

  } catch (error) {
    // This catches critical errors (like Auth failing)
    console.error("Error initializing app:", error);
    dom.updateAuthStatus("Error: App failed to load.");
    dom.updateStatus(state, "Critical error. Please refresh.");
    dom.setLoading(true); // Keep button disabled
  }
}

// --- 4. EVENT HANDLERS ---
/**
 * Handles the "Get Compliment" button click.
 */
async function handleComplimentRequest() {
  if (state.isLoading) return;

  // 1. Check for paywall
  if (state.userPlan === 'free' && state.complimentCount >= 3) {
    dom.showPaywall(true);
    posthog.capture('paywall_viewed');
    return;
  }

  const query = dom.userInput.value.trim();
  if (!query) {
    dom.showResult("Please tell me a little something first!");
    return;
  }

  dom.setLoading(true);
  const selectedStyle = dom.styleSelector.value;
  const systemPrompt = PROMPTS[selectedStyle];

  try {
    // 2. Call our Vercel backend
    const compliment = await api.callVercelApi(query, systemPrompt);
    dom.showResult(compliment);

    // 3. Capture PostHog event
    posthog.capture('compliment_generated', {
      style: selectedStyle,
      plan: state.userPlan,
      query_length: query.length
    });

    // 4. Update and save the count (if free user)
    if (state.userPlan === 'free') {
      state.complimentCount++;
      dom.updateStatus(state);
      await firebase.saveComplimentCount(state.userId, state.complimentCount);
    }
  } catch (error) {
    // This catches errors from our Vercel API
    console.error("Error from handleComplimentRequest:", error);
    dom.showResult(`Sorry, an error occurred: ${error.message}`);
  } finally {
    dom.setLoading(false);
  }
}

/**
 * Handles the "Upgrade Now" button click.
 */
async function handleUpgradeRequest() {
  dom.setUpgradeLoading(true);

  try {
    // 1. Save "pro" status to Firebase
    const success = await firebase.saveProPlan(state.userId);

    if (success) {
      // 2. Update local state
      state.userPlan = 'pro';
      
      // 3. Update UI
      dom.updateStatus(state);
      dom.unlockProFeatures(state.userPlan);
      dom.showPaywall(false);

      // 4. Capture PostHog event
      posthog.capture('upgrade_success', { new_plan: 'pro' });
      if (posthog.people && typeof posthog.people.set === 'function') {
        posthog.people.set({ plan: 'pro' });
      }

    } else {
      // This happens if the save failed (e.g., ad-blocker)
      throw new Error("Database update failed. Please check your connection or ad-blocker.");
    }
  } catch (error) {
    console.error("Error upgrading plan:", error);
    dom.setUpgradeLoading(false, `Error: ${error.message}`);
  }
  // Note: We intentionally don't reset the button text on success,
  // because the modal is hidden.
}

// --- 5. START THE APP ---
// Add all event listeners
dom.generateBtn.addEventListener('click', handleComplimentRequest);
dom.upgradeBtn.addEventListener('click', handleUpgradeRequest);
dom.closePaywallBtn.addEventListener('click', () => dom.showPaywall(false));

// Call the main boot function
initializeApp();
