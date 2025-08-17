/**
 * iNFORMA☬SHΞN™ Core v2
 *
 * This worker serves the custom iNFORMA☬SHΞN UI and provides a non-streaming
 * backend API to connect to Cloudflare's Workers AI using Google's Gemma model.
 * It replaces the default streaming template logic.
 */
import { Env, ChatMessage } from "./types";

// The model we'll use for the AI responses.
// @cf/google/gemma-7-b-it-lora is a powerful and free model available on Cloudflare.
const MODEL_ID = "@cf/google/gemma-7b-it";

export default {
  /**
   * Main request handler for the Worker.
   * It serves the static frontend and handles API requests.
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Route for our custom AI API endpoint
    // Your frontend JavaScript calls this specific endpoint.
    if (url.pathname === "/api/ai") {
      if (request.method === "POST") {
        return handleApiRequest(request, env);
      }
      return new Response("Method Not Allowed", { status: 405 });
    }

    // For any other path, serve the static assets (your index.html).
    // 'ASSETS' is the binding to the Pages static content.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

/**
 * Handles the POST request to the /api/ai endpoint.
 * This function is NON-STREAMING and returns a complete JSON response.
 */
async function handleApiRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    // 1. Get the message history from the user's request.
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    if (!messages) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Call the Workers AI model.
    // We are not using streaming here, so we await the full response.
    const aiResponse = await env.AI.run(MODEL_ID, {
      messages,
    });

    // 3. Send the complete response back to your UI.
    // Your frontend code expects a JSON object with a 'response' property.
    return new Response(JSON.stringify(aiResponse), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in AI API request:", error);
    return new Response(JSON.stringify({ error: "Failed to process AI request" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
