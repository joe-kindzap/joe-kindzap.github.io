/* File: /src/api.js */
/* This file must be inside a folder named "src" in the root directory. */
/* This is the *frontend* service that calls our Vercel backend. */

export async function callVercelApi(userQuery, systemPrompt) {
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
        // Re-throw the error so the main app can handle it
        throw error;
    }
}
