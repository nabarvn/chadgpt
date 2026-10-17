export function encodeEvent(payload: Record<string, string>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function* parseServerSentEvents<T>(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<T> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  const parseEvent = (event: string): T | null => {
    const data = event
      .split("\n")
      .find((line) => line.startsWith("data: "))
      ?.slice(6);

    return data ? (JSON.parse(data) as T) : null;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const parsed = parseEvent(event);
          if (parsed) yield parsed;
        }
      }

      if (done) break;
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      const parsed = parseEvent(buffer);
      if (parsed) yield parsed;
    }
  } finally {
    reader.releaseLock();
  }
}
