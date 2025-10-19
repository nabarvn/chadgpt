import { useRouter } from "next/navigation";
import { TransitionStartFunction } from "react";

type AppRouterInstance = ReturnType<typeof useRouter>;

const CONSTANTS = {
  CREATE_TIMEOUT: 30000,
};

interface ApiChatResponse {
  success: boolean;
  chatId?: string;
  message?: string;
  error?: string;
}

interface ApiDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface CreateChatParams {
  prompt?: string;
  router?: AppRouterInstance;
  startTransition?: TransitionStartFunction;
  loadingText?: string;
  successText?: string;
}

export async function createChat(
  params: CreateChatParams = {},
): Promise<string> {
  const { prompt, router, startTransition } = params;
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    CONSTANTS.CREATE_TIMEOUT,
  );

  try {
    const response = await fetch("/api/chats", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = "Failed to create chat";

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data: ApiChatResponse = await response.json();

    if (!data.success || !data.chatId) {
      throw new Error(data.error || "Failed to create chat");
    }

    if (router && startTransition) {
      const chatUrl = prompt
        ? `/chat/${data.chatId}?prompt=${encodeURIComponent(prompt)}`
        : `/chat/${data.chatId}`;

      startTransition(() => {
        router.push(chatUrl);
      });
    }

    return data.chatId;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Chat creation timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    CONSTANTS.CREATE_TIMEOUT,
  );

  try {
    const response = await fetch(`/api/chats/${chatId}`, {
      method: "DELETE",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = "Failed to delete chat";

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data: ApiDeleteResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to delete chat");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Delete operation timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function deleteAllChats(): Promise<void> {
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    CONSTANTS.CREATE_TIMEOUT,
  );

  try {
    const response = await fetch("/api/chats", {
      method: "DELETE",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = "Failed to delete chats";

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const data: ApiDeleteResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to delete chats");
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "Delete all chats operation timed out. Please try again.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
