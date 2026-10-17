import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const UNAVAILABLE_MESSAGE =
  "ChadGPT is temporarily unavailable due to high demand. Please try again later.";

const QUOTA_CODES = new Set([
  "insufficient_quota",
  "credit_balance_exhausted",
  "organization_usage_limit_exceeded",
  "organization_spend_limit_exceeded",
  "project_spend_limit_exceeded",
]);

interface ErrorClassification {
  message: string;
  status: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectCodes(error: unknown): string[] {
  if (!isRecord(error)) return [];
  const nested = isRecord(error.error) ? error.error : null;

  return [error.code, error.type, nested?.code, nested?.type].filter(
    (value): value is string => typeof value === "string",
  );
}

export function classifyOpenAIError(
  error: unknown,
): ErrorClassification | null {
  const isQuotaExhausted = collectCodes(error).some((code) =>
    QUOTA_CODES.has(code),
  );

  return isQuotaExhausted
    ? { message: UNAVAILABLE_MESSAGE, status: 503 }
    : null;
}

export default openai;
