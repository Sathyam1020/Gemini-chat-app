// app/api/chat/route.ts (for Next.js App Router)
// or pages/api/chat.ts (for Next.js Pages Router)

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

// This is important for deploying to Vercel's Edge Network
export const runtime = "edge";

export async function POST(req: NextRequest) {
  // Parse the incoming JSON body to get the 'messages' array
  const { messages } = await req.json();

  // Basic validation for the API key
  if (!process.env.GEMINI_API_KEY) {
    return new Response("GEMINI_API_KEY not set in environment variables.", { status: 500 });
  }

  try {
    // Initialize Google Generative AI with your API key
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Get the specific Gemini model (gemini-pro is also an option for more robust use cases)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate content from the model in a streaming fashion
    // The 'messages' array is mapped to the format expected by the Gemini API
    const result = await model.generateContentStream({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contents: messages.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
    });

    // Create a TextEncoder to convert strings to bytes for the stream
    const encoder = new TextEncoder();

    // Create a ReadableStream to send the AI's response chunk by chunk
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text(); // Get the plain text from the AI chunk
          controller.enqueue(encoder.encode(text)); // Enqueue the encoded text
        }
        controller.close(); // Close the stream when done
      },
    });

    // Return the stream as the response body
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8', // Explicitly declare content type
      },
    });

  } catch (error: any) {
    // Log and return an error response if something goes wrong
    console.error("API Error:", error);
    return new Response(`Error processing request: ${error.message || "Unknown error"}`, { status: 500 });
  }
}