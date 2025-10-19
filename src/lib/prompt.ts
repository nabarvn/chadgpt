import { Session } from "next-auth";
import { GPTMessage } from "@/typings";

const CONSTANTS = {
  REQUEST_TIMEOUT: 60000,
};

export async function getPromptResponseStream(
  outboundMessages: GPTMessage[],
  id: string,
  model: string,
  session: Session,
  timezone: string,
): Promise<ReadableStream<Uint8Array>> {
  const controller = new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    CONSTANTS.REQUEST_TIMEOUT,
  );

  try {
    const response = await fetch("/api/prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outboundMessages,
        id,
        model,
        session,
        timezone,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(await response.text());
      }

      const responseText = await response.text();
      let errorMessage = "Something went wrong. Please try again!";

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Something went wrong. Please try again!");
    }

    return response.body;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        "The request timed out as the model took too long to respond. Please try again.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
