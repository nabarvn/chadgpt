import { parseServerSentEvents } from "@/lib/sse";

type TitleEvent =
  | { type: "delta"; text: string }
  | { type: "done"; text: string }
  | { type: "error"; error: string };

export async function getTitleStream(
  chatId: string,
  onUpdate: (title: string) => void,
  sourceMessage?: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`/api/chats/${chatId}/title`, {
    method: "POST",
    headers: sourceMessage ? { "Content-Type": "application/json" } : undefined,
    body: sourceMessage ? JSON.stringify({ sourceMessage }) : undefined,
    signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: unknown;
    } | null;

    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : "Failed to generate chat title",
    );
  }

  if (!response.body) {
    throw new Error("Failed to generate chat title");
  }

  let accumulatedTitle = "";
  let finalTitle = "";

  for await (const payload of parseServerSentEvents<TitleEvent>(
    response.body,
  )) {
    if (payload.type === "delta") {
      accumulatedTitle += payload.text;
      onUpdate(accumulatedTitle);
    } else if (payload.type === "done") {
      finalTitle = payload.text;
      onUpdate(finalTitle);
    } else {
      throw new Error(payload.error);
    }
  }

  if (!finalTitle) {
    throw new Error("Chat title stream ended unexpectedly");
  }

  return finalTitle;
}

export async function saveTitle(
  chatId: string,
  title: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}/title`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
    signal,
  });

  if (!response.ok) {
    throw new Error("Failed to save chat title");
  }
}
