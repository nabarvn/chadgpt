"use client";

import Image from "next/image";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { DocumentData } from "firebase/firestore";
import { memo, useMemo, useCallback } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { CodeRenderer, LinkRenderer } from "@/components/renderers";
import { Message as MessageType, SerializedMessage } from "@/typings";

const CONSTANTS = {
  AVATAR_SIZE: 28,
  DEFAULT_AVATAR: "/default-avatar.png",
  STREAMING_CLASS: "streaming",
};

interface MessageProps {
  message: DocumentData | SerializedMessage | MessageType;
  isChad: boolean;
  isStreaming?: boolean;
}

interface ValidatedMessageData {
  user: {
    avatar: string;
    name: string;
    _id: string;
  };
  text: string | React.ReactNode;
}

function isSerializedMessage(
  message: DocumentData | SerializedMessage | MessageType,
): message is SerializedMessage | MessageType {
  return !!message && "user" in message && !!(message as MessageType).user;
}

function validateMessageData(
  message: DocumentData | SerializedMessage | MessageType,
): ValidatedMessageData | null {
  try {
    if (!isSerializedMessage(message)) {
      return null;
    }

    const messageData = message;

    if (
      !messageData.user?.avatar ||
      (!messageData.text && messageData.text !== "")
    ) {
      return null;
    }

    return {
      user: {
        avatar: messageData.user.avatar || CONSTANTS.DEFAULT_AVATAR,
        name: messageData.user.name,
        _id: messageData.user._id,
      },
      text: messageData.text,
    };
  } catch (error) {
    console.error("Error validating message data:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return null;
  }
}

const MarkdownComponents: Partial<Components> = {
  pre: ({ children }) => <>{children}</>,
  code: ({ children, className, ...rest }) => (
    <CodeRenderer className={className} {...rest}>
      {children}
    </CodeRenderer>
  ),
  a: ({ href, children }) => (
    <LinkRenderer href={href}>{children}</LinkRenderer>
  ),
  h1: ({ children }) => (
    <h1 className="mb-4 mt-6 font-bold text-gray-900 first:mt-0 dark:text-gray-100">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-gray-700 last:mb-0 dark:text-gray-300">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mb-4 ml-4 list-outside list-disc space-y-1 text-gray-700 dark:text-gray-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 ml-4 list-outside list-decimal space-y-1 text-gray-700 dark:text-gray-300">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed text-gray-700 dark:text-gray-300">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-600 dark:border-gray-600 dark:text-gray-400">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="table min-w-full table-fixed divide-y divide-gray-300 rounded-lg border border-gray-300 dark:divide-gray-800 dark:border-gray-800">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-gray-300 bg-gray-50 px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
      {children}
    </td>
  ),
};

const MessageContent = memo(
  ({
    text,
    isStreaming,
  }: {
    text: string | React.ReactNode;
    isStreaming?: boolean;
  }) => {
    const streamingClass = isStreaming ? CONSTANTS.STREAMING_CLASS : "";

    const content = useMemo(() => {
      if (typeof text === "string") {
        const trimmedText = text.trimStart();

        return (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={MarkdownComponents}
          >
            {trimmedText}
          </ReactMarkdown>
        );
      }

      return (
        <div className="leading-relaxed text-gray-700 dark:text-gray-300">
          {text}
        </div>
      );
    }, [text]);

    return (
      <div
        className={`prose prose-gray w-full max-w-none dark:prose-invert ${streamingClass}`}
      >
        {content}
      </div>
    );
  },
);

const MessageAvatar = memo(
  ({ avatar, userName }: { avatar: string; userName?: string }) => {
    const handleImageError = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = CONSTANTS.DEFAULT_AVATAR;
      },
      [],
    );

    return (
      <div className="shrink-0 object-cover">
        <Image
          unoptimized
          src={avatar}
          referrerPolicy="no-referrer"
          height={CONSTANTS.AVATAR_SIZE}
          width={CONSTANTS.AVATAR_SIZE}
          alt={userName ? `${userName}'s avatar` : "User avatar"}
          className="h-7 w-7"
          onError={handleImageError}
        />
      </div>
    );
  },
);

const Message = ({ message, isChad, isStreaming }: MessageProps) => {
  const validatedData = useMemo(() => validateMessageData(message), [message]);

  const containerClasses = `flex text-gray-700 dark:text-gray-300 py-4 max-w-2xl mx-auto space-x-3 px-4 sm:space-x-5 sm:px-10 sm:py-5 w-full ${
    isChad ? "bg-gray-100 dark:bg-[#434654]" : ""
  }`;

  if (!validatedData) {
    console.error("Message: Invalid message data provided:", {
      message,
      timestamp: new Date().toISOString(),
    });

    return (
      <div className={containerClasses}>
        <MessageAvatar avatar={CONSTANTS.DEFAULT_AVATAR} />

        <div className="min-w-0 max-w-full flex-1 overflow-hidden">
          <div className="prose prose-gray w-full max-w-none dark:prose-invert">
            <p className="italic text-gray-500 dark:text-gray-400">
              Invalid message data
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { user, text } = validatedData;

  return (
    <div className={containerClasses}>
      <MessageAvatar avatar={user.avatar} userName={user.name} />

      <div className="min-w-0 max-w-full flex-1 overflow-hidden">
        <MessageContent text={text} isStreaming={isStreaming} />
      </div>
    </div>
  );
};

export default memo(Message);
