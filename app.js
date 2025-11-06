/* File: /app.js */
/* This is the main JavaScript controller, placed in the root directory. */
/* It's the "brain" of the application and coordinates all other modules. */

// --- 1. IMPORTS ---
import { PROMPTS } from './src/config.js';
import { callVercelApi } from './src/api.js';
import { 
    dom, 
    setLoading, 
    showPaywall, 
    updateUserUI, 
    unlockProFeatures, 
    setOutputText,
    resetUpgradeButton,
    setUpgradeButtonLoading
} from './src/dom.js';
import { 
    initAuth, 
    fetchUserConfig, 
    updateUserPlan, 
    incrementComplimentCount 
} from './src/firebase.js';


// --- 2. MAIN APP STATE ---
// This holds the "live" data for our app.
let state = {
    isLoading: false,
    isAuthReady: false,
    userId: null,
    config: {
        plan: 'free',
        style: 'wholesome',
        complimentCount: 0
    }
};

// --- 3. EVENT HANDLERS (The "Coordinator" Logic) ---

/**
 * Handles the main "Get Compliment" button click.
 * Coordinates DOM, API, and Firebase services.
 */
async function handleComplimentRequest() {
    if (state.isLoading || !state.isAuthReady) return;

    // 1. Check Paywall (Gatekeeper)
    const { plan, complimentCount } = state.config;
    if (plan === 'free' && complimentCount >= 3) {
        showPaywall(true);
        return;
    }

    // 2. Get data from DOM
    const query = dom.userInput.value.trim();
    if (!query) {
        setOutputText("Please tell me a little something first!");
        return;
    }

    // 3. Set loading state (DOM)
    setLoading(true);

    try {
        // 4. Get config and call API
        const selectedStyle = dom.styleSelector.value;
        const systemPrompt = PROMPTS[selectedStyle];
        const compliment = await callVercelApi(query, systemPrompt);

        // 5. Update UI (DOM)
        setOutputText(compliment);

        // 6. Capture PostHog Event
        if (window.posthog) {
            posthog.capture('compliment_generated', {
                style: selectedStyle,
                plan: plan,
                query_length: query.length
            });
        }

        // 7. Update count (Firebase & State)
        if (plan === 'free') {
            state.config.complimentCount++;
            await incrementComplimentCount(state.userId, state.config.complimentCount);
            updateUserUI(null, state.config); // Update just the status text
        }

    } catch (error) {
        console.error("Error from handleComplimentRequest:", error);
        setOutputText(`Sorry, an error occurred: ${error.message}`);
    } finally {
        setLoading(false); // 8. Reset loading state (DOM)
    }
}

/**
 * Handles the "Upgrade Now" button click.
 */
async function handleUpgradeRequest() {
    setUpgradeButtonLoading();

    try {
        // 1. Simulate 1-second delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 2. Update Firebase
        await updateUserPlan(state.userId);

        // 3. Update local state
        state.config.plan = 'pro';

        // 4. Capture PostHog Event
        if (window.posthog) {
            posthog.capture('upgrade_success', { plan: 'pro' });
            if (posthog.people && typeof posthog.people.set === 'function') {
                posthog.people.set({ plan: 'pro' });
            }
        }

        // 5. Update UI
        updateUserUI(null, state.config);
        unlockProFeatures();
        showPaywall(false);

    } catch (error) {
        console.error("Error upgrading plan:", error);
    } finally {
        resetUpgradeButton();
    }
}

/**
 * Called when a user successfully signs in (even anonymously).
 * @param {object} user - The Firebase Auth user object.
 */
async function onUserSignedIn(user) {
    state.userId = user.uid;
    state.isAuthReady = true;

    // 1. Fetch user data from Firestore
    try {
        state.config = await fetchUserConfig(user.uid);

        // 2. Update the UI
        updateUserUI(user, state.config);

        // 3. Identify user in PostHog
        if (window.posthog) {
            posthog.identify(user.uid);
            if (posthog.people && typeof posthog.people.set === 'function') {
                posthog.people.set({
                    plan: state.config.plan,
                    assigned_style: state.config.style
                });
            }
        }

        // 4. Enable the main app
        dom.generateBtn.disabled = false;
        dom.btnText.textContent = "Get Compliment";

    } catch (error) {
        console.error("Error fetching user config:", error);
        dom.authStatus.textContent = "Error loading your data.";
    }
}

/**
 * Called if anonymous sign-in fails.
 * @param {object} error - The error object.
 */
function onUserSignedOut(error) {
    console.error("Sign-out or Auth Error:", error);
    dom.authStatus.textContent = "Error connecting to user service.";
}


// --- 4. START THE APP ---

/**
 * Main entry point for the entire application.
 */
function main() {
    // Set up all our button clicks
    dom.generateBtn.addEventListener('click', handleComplimentRequest);
    dom.upgradeBtn.addEventListener('click', handleUpgradeRequest);
    dom.closePaywallBtn.addEventListener('click', () => showPaywall(false));

    // Start the authentication process, which kicks off everything else
    initAuth(onUserSignedIn, onUserSignedOut);
}

// Run the app!
main();
