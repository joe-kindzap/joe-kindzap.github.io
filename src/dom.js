/* File: /src/dom.js */
/* This file must be inside a folder named "src" in the root directory. */
/* This module's only job is to update the HTML. */

// --- 1. Export all DOM Elements ---

export const dom = {
    authStatus: document.getElementById('auth-status'),
    styleStatus: document.getElementById('style-status'),
    generateBtn: document.getElementById('generate-btn'),
    btnSpinner: document.getElementById('btn-spinner'),
    btnText: document.getElementById('btn-text'),
    userInput: document.getElementById('user-input'),
    outputContainer: document.getElementById('output-container'),
    outputText: document.getElementById('output-text'),
    paywall: document.getElementById('paywall'),
    closePaywallBtn: document.getElementById('close-paywall-btn'),
    upgradeBtn: document.getElementById('upgrade-btn'),
    styleSelector: document.getElementById('style-selector'),
};

// --- 2. Export UI Helper Functions ---

/**
 * Manages the loading state of the main button.
 * @param {boolean} isLoading - Whether to show the loading state.
 */
export function setLoading(isLoading) {
    dom.generateBtn.disabled = isLoading;
    if (isLoading) {
        dom.btnSpinner.classList.remove('hidden');
        dom.btnText.textContent = "Generating...";
    } else {
        dom.btnSpinner.classList.add('hidden');
        dom.btnText.textContent = "Get Compliment";
    }
}

/**
 * Shows or hides the paywall modal.
 * @param {boolean} show - Whether to show the paywall.
 */
export function showPaywall(show) {
    if (show) {
        dom.paywall.classList.remove('hidden');
    } else {
        dom.paywall.classList.add('hidden');
    }
}

/**
 * Updates the UI based on the user's data.
 * @param {object} user - The Firebase auth user.
 * @param {object} config - The user's config (plan, style, count).
 */
export function updateUserUI(user, config) {
    if (user) {
        dom.authStatus.textContent = `Your User ID: ${user.uid.substring(0, 8)}...`;
    }
    
    if (config) {
        const { plan, style, count } = config;
        dom.styleStatus.textContent = `Style Group: ${style} (Plan: ${plan}) (Count: ${count})`;
        
        // Set the dropdown's default value
        if (Array.from(dom.styleSelector.options).some(o => o.value === style)) {
            dom.styleSelector.value = style;
        }

        // Unlock pro features if applicable
        if (plan === 'pro') {
            unlockProFeatures();
        }
    }
}

/**
 * Enables the "Pro" options in the style selector.
 */
export function unlockProFeatures() {
    dom.styleSelector.querySelectorAll('option').forEach(option => {
        if (['shakespeare', 'gen_z', 'business'].includes(option.value)) {
            option.disabled = false;
        }
    });
}

/**
 * Updates the output text with a message.
 * @param {string} text - The text to display.
 */
export function setOutputText(text) {
    dom.outputText.textContent = text;
    dom.outputContainer.classList.remove('hidden');
}

/**
 * Resets the upgrade button after an attempt.
 */
export function resetUpgradeButton() {
    dom.upgradeBtn.disabled = false;
    dom.upgradeBtn.textContent = "Upgrade Now ($5/mo)";
}

/**
 * Sets the upgrade button to a loading state.
 */
export function setUpgradeButtonLoading() {
    dom.upgradeBtn.disabled = true;
    dom.upgradeBtn.textContent = "Processing payment...";
}
