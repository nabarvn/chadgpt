import { Message } from "@/typings";
import { encodeEvent } from "@/lib/sse";
import { adminDb } from "@/firebase/server";
import { getAuthSession } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getSystemPrompt } from "@/config/system-prompt";
import openai, { classifyOpenAIError } from "@/lib/openai";

export const maxDuration = 300;

const MODEL = "gpt-6-luna";
const REQUEST_TIMEOUT = 300_000;
const PROMPT_ERROR_MESSAGE = "Failed to process chat request.";

interface ChatRequest {
  outboundMessages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  id: string;
  turnId: string;
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
    typeof req.turnId === "string" &&
    /^[a-zA-Z0-9_-]{1,128}$/.test(req.turnId) &&
    req.outboundMessages.at(-1)?.role === "user"
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

async function saveTurn(
  userMessage: Message,
  assistantMessage: Message,
  chatId: string,
  userEmail: string,
  turnId: string,
): Promise<void> {
  try {
    const messagesRef = adminDb
      .collection("users")
      .doc(userEmail)
      .collection("chats")
      .doc(chatId)
      .collection("messages");

    const batch = adminDb.batch();

    batch.set(messagesRef.doc(`${turnId}-user`), userMessage);
    batch.set(messagesRef.doc(`${turnId}-assistant`), assistantMessage);

    await batch.commit();
  } catch (error) {
    console.error("Error saving chat turn to Firestore:", {
      error: error instanceof Error ? error.message : "Unknown error",
      chatId,
      userEmail,
      turnId,
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
            "Invalid request body. Missing required fields: outboundMessages, id, or turnId.",
        },
        { status: 400 },
      );
    }

    const { outboundMessages, id: chatId, turnId, timezone } = body;
    const { geo } = request;

    const session = await getAuthSession();

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

    const response = await openai.chat.completions.create(
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: getSystemPrompt({ geo, timezone }),
          },
          ...outboundMessages,
        ],
        reasoning_effort: "medium",
        max_completion_tokens: 1000,
        stream: true,
      },
      { timeout: REQUEST_TIMEOUT, signal: request.signal },
    );

    const encoder = new TextEncoder();

    let completion = "";
    let cancelled = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.choices[0]?.delta?.content;

            if (text) {
              completion += text;

              controller.enqueue(
                encoder.encode(encodeEvent({ type: "delta", text })),
              );
            }
          }

          if (!completion) {
            throw new Error("OpenAI returned an empty response");
          }

          if (cancelled || request.signal.aborted) {
            return;
          }

          const now = Date.now();

          const userMessage: Message = {
            text: outboundMessages[outboundMessages.length - 1].content.trim(),
            createdAt: new Date(now),
            user: {
              _id: userEmail,
              name: session.user?.name || "User",
              avatar:
                session.user?.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  session.user?.name || "User",
                )}`,
            },
          };

          const assistantMessage: Message = {
            text: completion,
            createdAt: new Date(now + 1),
            user: {
              _id: "chadgpt",
              name: "Chad",
              avatar: "/chad.png",
            },
          };

          await saveTurn(
            userMessage,
            assistantMessage,
            chatId,
            userEmail,
            turnId,
          );

          controller.enqueue(encoder.encode(encodeEvent({ type: "done" })));
          controller.close();
        } catch (error) {
          const wasAborted =
            cancelled ||
            request.signal.aborted ||
            (error instanceof Error && error.name === "AbortError");

          if (!wasAborted) {
            const classification = classifyOpenAIError(error);

            console.error("Error while streaming OpenAI response:", {
              error,
              chatId,
              userEmail,
              timestamp: new Date().toISOString(),
            });

            controller.enqueue(
              encoder.encode(
                encodeEvent({
                  type: "error",
                  error: classification?.message || PROMPT_ERROR_MESSAGE,
                }),
              ),
            );

            controller.close();
          }
        }
      },
      cancel() {
        cancelled = true;
        response.controller.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    if (
      request.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      return new Response(null, { status: 499 });
    }

    const classification = classifyOpenAIError(error);

    console.error("Error in OpenAI chat endpoint:", {
      error,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json<ApiErrorResponse>(
      {
        success: false,
        error: classification?.message || PROMPT_ERROR_MESSAGE,
      },
      {
        status: classification?.status || 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
