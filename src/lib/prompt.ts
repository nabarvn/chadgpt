import { GPTMessage } from "@/typings";
import { parseServerSentEvents } from "@/lib/sse";

type PromptEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; error: string };

export async function getPromptResponseStream(
  outboundMessages: GPTMessage[],
  id: string,
  turnId: string,
  timezone: string,
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch("/api/prompt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      outboundMessages,
      id,
      turnId,
      timezone,
    }),
    signal,
  });

  if (!response.ok) {
    const responseText = await response.text();
    let errorMessage = "Something went wrong. Please try again!";

    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Something went wrong. Please try again.");
  }

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of parseServerSentEvents<PromptEvent>(
          response.body!,
        )) {
          if (event.type === "delta") {
            controller.enqueue(encoder.encode(event.text));
          } else if (event.type === "error") {
            throw new Error(event.error);
          } else {
            break;
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
