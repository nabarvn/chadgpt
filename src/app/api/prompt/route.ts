import openai from "@/lib/openai";
import { Message } from "@/typings";
import { adminDb } from "@/firebase/server";
import { NextRequest, NextResponse } from "next/server";
import { getSystemPrompt } from "@/config/system-prompt";
import { OpenAIStream, StreamingTextResponse } from "ai";

export const maxDuration = 60;

interface ChatRequest {
  outboundMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  id: string;
  model: string;
  session: {
    user: {
      email: string;
    };
  };
  timezone?: string;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

function validateChatRequest(body: unknown): body is ChatRequest {
  const req = body as ChatRequest;

  return (
    req &&
    typeof req === "object" &&
    Array.isArray(req.outboundMessages) &&
    typeof req.id === "string" &&
    typeof req.model === "string" &&
    typeof req.session?.user?.email === "string"
  );
}

async function verifyChatOwnership(
  chatId: string,
  userEmail: string,
): Promise<boolean> {
  try {
    const chatDoc = await adminDb
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .doc(chatId)
      .get();

    return chatDoc.exists;
  } catch (error) {
    console.error("Error verifying chat ownership:", error);
    return false;
  }
}

async function saveMessage(
  message: Message,
  chatId: string,
  userEmail: string,
): Promise<void> {
  try {
    await adminDb
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .add(message);
  } catch (error) {
    console.error("Error saving message to Firestore:", {
      error: error instanceof Error ? error.message : "Unknown error",
      chatId,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!validateChatRequest(body)) {
      return NextResponse.json<ApiErrorResponse>(
        {
          success: false,
          error:
            "Invalid request body. Missing required fields: outboundMessages, id, model, or session.",
        },
        { status: 400 },
      );
    }

    const { outboundMessages, id: chatId, model, session, timezone } = body;
    const { geo } = request;

    if (!session?.user?.email) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Authentication required." },
        { status: 401 },
      );
    }

    // verify chat ownership for security
    const userEmail = session.user.email;
    const chatExists = await verifyChatOwnership(chatId, userEmail);

    if (!chatExists) {
      return NextResponse.json<ApiErrorResponse>(
        { success: false, error: "Chat not found or access denied." },
        { status: 404 },
      );
    }

    const messages = [
      {
        role: "system" as const,
        content: getSystemPrompt({ geo, timezone }),
      },
      ...outboundMessages,
    ];

    // create OpenAI streaming request
    const response = await openai.chat.completions.create({
      model,
      user: chatId,
      messages,
      temperature: 0.7,
      top_p: 1,
      max_tokens: 1000,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
      n: 1,
    });

    /* 
      Create custom ReadableStream 
      to handle OpenAI streaming response
    */
    const encoder = new TextEncoder();

    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            // transform chunk into Server-Sent Events format
            const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }

          // signal completion
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("Error while streaming OpenAI response:", {
            error:
              error instanceof Error
                ? error.message
                : "Unknown streaming error",
            chatId,
            userEmail,
            timestamp: new Date().toISOString(),
          });

          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    const stream = OpenAIStream(new Response(customReadable), {
      async onCompletion(completion) {
        const message: Message = {
          text: completion,
          createdAt: new Date(),
          user: {
            _id: "chadgpt",
            name: "Chad",
            avatar: "/chad.png",
          },
        };

        await saveMessage(message, chatId, userEmail);
      },
    });

    return new StreamingTextResponse(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error in OpenAI chat endpoint:", {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorResponse>(
      { success: false, error: "Failed to process chat request." },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
