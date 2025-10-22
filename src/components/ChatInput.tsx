"use client";

import { Session } from "next-auth";
import { isMobile } from "react-device-detect";
import { StarIcon } from "@heroicons/react/24/outline";
import TextareaAutosize from "react-textarea-autosize";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

import {
  FormEvent,
  KeyboardEvent,
  RefObject,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";

const CONSTANTS = {
  MAX_MESSAGE_LENGTH: 5000,
  MIN_MESSAGE_LENGTH: 1,
  TEXTAREA_MIN_ROWS: 1,
  TEXTAREA_MAX_ROWS: 3,
};

interface ChatInputProps {
  session: Session | null;
  chadProcessing: boolean;
  sendMessage: (input: string) => Promise<void>;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

interface InputValidation {
  isValid: boolean;
  error?: string;
}

function validateMessage(message: string): InputValidation {
  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return { isValid: false, error: "Please enter a message before sending." };
  }

  if (trimmedMessage.length > CONSTANTS.MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      error: `Message is too long. Maximum ${CONSTANTS.MAX_MESSAGE_LENGTH} characters allowed.`,
    };
  }

  if (trimmedMessage.length < CONSTANTS.MIN_MESSAGE_LENGTH) {
    return { isValid: false, error: "Please enter a message before sending." };
  }

  return { isValid: true };
}

function validateSession(session: Session | null): boolean {
  return Boolean(session?.user?.email);
}

const ChatInput = ({
  session,
  chadProcessing,
  sendMessage,
  textareaRef,
}: ChatInputProps) => {
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const isValidSession = useMemo(() => validateSession(session), [session]);
  const validation = useMemo(() => validateMessage(prompt), [prompt]);

  // determine if form can be submitted
  const canSubmit = useMemo(() => {
    return (
      isValidSession && !chadProcessing && !isSubmitting && validation.isValid
    );
  }, [isValidSession, chadProcessing, isSubmitting, validation.isValid]);

  const characterCount = useMemo(() => prompt.length, [prompt]);

  const isApproachingLimit =
    characterCount > CONSTANTS.MAX_MESSAGE_LENGTH * 0.8;

  const isOverLimit = characterCount > CONSTANTS.MAX_MESSAGE_LENGTH;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !isMobile) {
        e.preventDefault();

        if (canSubmit && formRef.current) {
          formRef.current.requestSubmit();
        }
      }
    },
    [canSubmit],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setPrompt(newValue);

      if (newValue.length > CONSTANTS.MAX_MESSAGE_LENGTH) {
        setInputError(
          `Message is too long. Maximum ${CONSTANTS.MAX_MESSAGE_LENGTH} characters allowed.`,
        );
      } else {
        setInputError(null);
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!isValidSession) {
        setInputError("Please sign in to send messages.");
        return;
      }

      const messageValidation = validateMessage(prompt);

      if (!messageValidation.isValid) {
        setInputError(
          messageValidation.error || "Please enter a message before sending.",
        );

        return;
      }

      if (isSubmitting || chadProcessing) {
        return;
      }

      const input = prompt.trim();

      setIsSubmitting(true);
      setInputError(null);

      try {
        setPrompt("");
        await sendMessage(input);
      } catch (error) {
        setPrompt(input);

        let errorMessage = "Failed to send message. Please try again.";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        setInputError(errorMessage);

        console.error("Error sending message:", {
          error: error instanceof Error ? error.message : "Unknown error",
          messageLength: input.length,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isValidSession, prompt, isSubmitting, chadProcessing, sendMessage],
  );

  const handleTextareaFocus = useCallback(() => {
    if (textareaRef.current && isValidSession && !chadProcessing) {
      textareaRef.current.focus();
    }
  }, [textareaRef, isValidSession, chadProcessing]);

  const isProcessing = chadProcessing || isSubmitting;
  const showCharacterCount = isApproachingLimit || isOverLimit;

  return (
    <div className="mb-3 mt-5 xl:mt-7">
      <div
        className={`bg-gray-300 dark:bg-gray-700/50 ${
          inputError && "bg-red-50 dark:bg-red-900/20"
        } rounded-lg text-sm text-gray-700 dark:text-gray-300`}
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex items-center space-x-5 rounded-lg bg-white p-3 shadow-lg dark:bg-gray-700"
          noValidate
          aria-label="Message input form"
        >
          <div className="relative flex-1">
            <TextareaAutosize
              ref={textareaRef}
              name="prompt"
              spellCheck
              autoComplete="off"
              autoFocus={isValidSession}
              value={prompt}
              rows={CONSTANTS.TEXTAREA_MIN_ROWS}
              maxRows={CONSTANTS.TEXTAREA_MAX_ROWS}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleTextareaFocus}
              className={`w-full resize-none overflow-y-auto break-words bg-transparent text-base scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 scrollbar-track-rounded-lg focus:outline-none disabled:cursor-not-allowed disabled:text-gray-300 dark:scrollbar-thumb-gray-500 ${
                inputError ? "border-red-500 focus:border-red-500" : ""
              }`}
              disabled={!isValidSession || isProcessing}
              placeholder={
                !isValidSession
                  ? "Please sign in to send messages..."
                  : "Send a message..."
              }
              maxLength={CONSTANTS.MAX_MESSAGE_LENGTH + 100}
              aria-describedby={
                inputError
                  ? "input-error"
                  : showCharacterCount
                    ? "char-count"
                    : undefined
              }
              aria-invalid={!!inputError}
              aria-label="Message input"
            />

            {showCharacterCount && (
              <div
                id="char-count"
                className={`absolute bottom-0 right-2 px-2 py-1 text-xs ${
                  isOverLimit
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                aria-live="polite"
              >
                {characterCount}/{CONSTANTS.MAX_MESSAGE_LENGTH}
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`flex items-center justify-center bg-[#11A37F] ${
              isProcessing &&
              "disabled:cursor-not-allowed disabled:bg-[#11A37F]"
            } text-white ${
              !isProcessing &&
              "active:bg-[#0C6952] disabled:cursor-not-allowed disabled:bg-gray-500/10 disabled:text-gray-300 disabled:hover:opacity-100 disabled:active:bg-gray-500/10 dark:disabled:bg-gray-300/10 dark:disabled:active:bg-gray-300/10"
            } h-7 w-9 self-end rounded px-3 py-2 font-bold transition-colors duration-200`}
            disabled={!canSubmit}
            aria-label={
              isProcessing
                ? "Sending message..."
                : canSubmit
                  ? "Send message"
                  : "Cannot send message"
            }
            aria-describedby={inputError ? "input-error" : undefined}
          >
            {isProcessing ? (
              <span className="loading block w-full" aria-hidden="true" />
            ) : (
              <PaperAirplaneIcon
                className="h-3 w-3 -rotate-45"
                aria-hidden="true"
              />
            )}
          </button>
        </form>

        {inputError && (
          <div
            id="input-error"
            className="text-balance rounded-md px-3 py-2 text-center text-sm text-red-600 dark:text-red-400"
            role="alert"
            aria-live="polite"
          >
            {inputError}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-3">
        <a
          href="https://git.new/chad"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <StarIcon className="mr-1 h-4 w-4" />
          Star the GitHub Repository
        </a>
      </div>
    </div>
  );
};

export default ChatInput;
