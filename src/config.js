/* File: /src/config.js */
/* This file must be inside a folder named "src" in the root directory. */
/* It holds all static configuration and keys. */

// These are your personal keys from your Firebase project.
// You still need to set up Firebase Security Rules!
export const firebaseConfig = {
  apiKey: "AIzaSyDwU2ezZgJKxVLBwD4FA7odorpzIHwPklI",
  authDomain: "kindzap-project.firebaseapp.com",
  projectId: "kindzap-project",
  storageBucket: "kindzap-project.firebasestorage.app",
  messagingSenderId: "1097934782133",
  appId: "1:1097934782133:web:9d8faa8c992366a8ef08fc"
};

// This object holds the different "personalities" for our AI.
export const PROMPTS = {
    // Free Styles
    witty: "You are a witty, slightly sarcastic, but ultimately very supportive friend. Generate a compliment that is clever and funny, based on the user's input.",
    wholesome: "You are a warm, empathetic, and wholesome friend. Generate a sincere, kind, and uplifting compliment based on the user's input. Be very encouraging.",
    
    // Premium Styles
    shakespeare: "You are Shakespeare. Generate a compliment in elegant, flowery, iambic-pentameter-style prose based on the user's input. Use words like 'thou', 'hath', and 'verily'.",
    gen_z: "You are a Gen Z TikToker. Generate a compliment that is 'for the moment' based on the user's input. Use modern slang. No cap, make it hit different. Bet.",
    business: "You are a business professional in a suit. Generate a compliment that sounds like corporate buzzwords. Synergize the user's input into a value-add statement."
};
