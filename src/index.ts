/**
 * iNFORMA☬SHΞN™ Core v3
 *
 * This worker serves the custom iNFORMA☬SHΞN UI and provides a non-streaming
 * backend API to connect to Cloudflare's Workers AI.
 * This version uses the stable Llama-3 model to ensure reliability.
 */
import { Env, ChatMessage } from "./types";

// The model we'll use for the AI responses.
// We are reverting to the stable and reliable Llama 3 model.
const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

export default {
  /**
   * Main request handler for the Worker.
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Route for our custom AI API endpoint
    if (url.pathname === "/api/ai") {
      if (request.method === "POST") {
        return handleApiRequest(request, env);
      }
      return new Response("Method Not Allowed", { status: 405 });
    }

    // For any other path, serve the static assets (your index.html).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

/**
 * Handles the POST request to the /api/ai endpoint.
 */
async function handleApiRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  try {
    const { messages } = (await request.json()) as { messages: ChatMessage[] };

    if (!messages) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call the Workers AI model.
    const aiResponse = await env.AI.run(MODEL_ID, {
      messages,
    });

    // Send the complete response back to your UI.
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
