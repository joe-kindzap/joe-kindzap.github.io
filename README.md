<!-- File: /README.md -->

<!-- This is the root README file for your project. -->

⚡ KindZap.com

Get an instant boost of kindness, powered by AI.

KindZap is a simple, freemium web application that provides AI-generated compliments to brighten your day. It's built to be a fun, positive, and simple experience.

Features

Freemium Model: Get three free compliments to try the app.

Pro Tier: Upgrade to a "Pro" plan for unlimited compliments.

Multiple Styles:

Free: Choose from "Witty" or "Wholesome" styles.

Pro: Unlock premium styles like "Shakespearean," "Gen Z," and "Corporate."

Tech Stack

This app is built with a clean, professional, and secure architecture.

Frontend (HTML/CSS): The entire UI, including all HTML and CSS, is contained in a single index.html file. It uses Tailwind CSS (via CDN) for modern styling.

Frontend (Logic): All frontend logic is contained in a single app.js file, which is loaded as a JavaScript Module. This includes:

DOM manipulation

State management

Firebase/Firestore integration

PostHog analytics calls

Backend (Database): Google Firebase (Firestore) is used to store user data, such as plan status (free/pro) and usage counts.

Backend (Secure AI): We use a Vercel Serverless Function (/api/getCompliment.js) to securely call the OpenAI API. This ensures our secret API key is never exposed to the browser.

Analytics: PostHog is integrated to capture key product events like compliment_generated, paywall_viewed, and upgrade_success.

Hosting: The app is hosted on Vercel, which handles the static frontend, the secure backend function, and all secret environment variables.
