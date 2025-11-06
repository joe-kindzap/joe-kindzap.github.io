/* File: /api/getCompliment.js */
/* This file *must* be inside a folder named "api" in the root directory. */
/* Vercel automatically finds this and treats it as a secure backend function. */

/**
 * This is our new "Serverless Function" (our tiny backend).
 * Vercel will run this file as a backend, not in the browser.
 *
 * HOW TO USE THIS:
 * 1. Create a new folder named "api" in your GitHub repository.
 * 2. Put this file *inside* that "api" folder.
 * 3. Vercel will automatically find it.
 */

// This is a "Node.js" backend, so the syntax is slightly different.
export default async function handler(request, response) {
  // 1. Get the data our frontend sent us (the prompt and style).
  // We use `request.json()` instead of `request.body` for Vercel.
  let userQuery, systemPrompt;
  try {
    const body = request.body;
    userQuery = body.userQuery;
    systemPrompt = body.systemPrompt;
  } catch (error) {
    return response.status(400).json({ error: "Invalid request body." });
  }

  // 2. Get our *SECRET* API key from Vercel's "Environment Variables".
  // This is the key! The browser can't see this.
  // In Vercel, you will create a secret named "OPENAI_API_KEY".
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    // This will happen if you forget to set the variable in Vercel.
    return response.status(500).json({ error: "Server configuration error: Missing API key." });
  }

  // 3. Define the OpenAI API and payload, just like before.
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery }
    ]
  };

  // 4. Call the *real* OpenAI API from our secure backend.
  try {
    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API Error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const result = await aiResponse.json();
    const text = result.choices?.[0]?.message?.content;

    // 5. Send the compliment *back* to our frontend.
    // We send it as JSON, with a key named "compliment".
    return response.status(200).json({ compliment: text });

  } catch (error) {
    console.error("Internal server error:", error);
    return response.status(500).json({ error: error.message });
  }
}
