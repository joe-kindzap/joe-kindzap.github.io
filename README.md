<!-- File: /README.md -->

<!-- This is the root file for your project. -->

⚡ KindZap.com

Get an instant boost of kindness, powered by AI.

KindZap is a simple, freemium web application that provides AI-generated compliments to brighten your day. It's built to be a fun, positive, and simple experience.

Features

Freemium Model: Get three free compliments to try the app.

Pro Tier: Upgrade to a "Pro" plan for unlimited compliments.

Multiple Styles:

Free: Choose from "Witty" or "Wholesome" styles.

Pro: Unlock premium styles like "Shakespearean," "Gen Z," and "Corporate."

"Best in Class" Tech Stack

This app is built with a professional, modular, and secure architecture.

Frontend: The UI is a clean index.html file, styled with Tailwind CSS.

App Logic: The frontend logic is written in vanilla JavaScript (ESM) and is fully modular. It's broken down by "Separation of Concerns":

/app.js: The main controller that manages state and events.

/src/dom.js: A dedicated service for all UI updates.

/src/firebase.js: A dedicated service for all Auth & Database logic.

/src/api.js: A dedicated service for calling our backend.

/src/config.js: A central file for all configuration.

Backend (Database): Google Firebase (Firestore) is used to store user data, such as plan status (free/pro) and usage counts.

Backend (Secure AI): We use a Vercel Serverless Function (/api/getCompliment.js) to securely call the OpenAI API. This ensures our secret API key is never exposed to the browser.

Hosting: The app is designed to be hosted on Vercel, which handles the static frontend, the secure backend function, and all environment variables.
