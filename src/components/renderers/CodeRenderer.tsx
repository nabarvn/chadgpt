"use client";

import { ReactNode, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CodeRendererProps {
  children: ReactNode;
  className?: string;
}

const CodeRenderer = ({ children, className }: CodeRendererProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // extract the text content from children for copying
  const getTextContent = (node: ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return node.toString();
    if (Array.isArray(node)) return node.map(getTextContent).join("");

    if (node && typeof node === "object" && "props" in node) {
      return getTextContent((node as any).props?.children);
    }

    return "";
  };

  const textContent = getTextContent(children);

  const language =
    className?.replace("language-", "").replace("hljs", "").trim() || "";

  const isCodeBlock = className && className.includes("language-");

  // inline code styling
  if (!isCodeBlock) {
    return (
      <code className="rounded px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:text-gray-200">
        {children}
      </code>
    );
  }

  return (
    <div className="not-prose my-4 w-full">
      {/* header with language and copy button */}
      <div className="mt-px flex items-center justify-between rounded-t-lg border-b border-gray-700 bg-gray-900 px-4 py-2 text-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
        <span className="text-xs font-medium">{language || "code"}</span>

        <CopyToClipboard text={textContent} onCopy={handleCopy}>
          <button
            className="flex items-center gap-2 rounded px-2 py-1 text-xs transition-colors duration-200 hover:bg-gray-800 dark:hover:bg-gray-800"
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-4 w-4" />
                <span>Copy code</span>
              </>
            )}
          </button>
        </CopyToClipboard>
      </div>

      {/* code content */}
      <div className="overflow-hidden rounded-b-lg bg-gray-50 dark:bg-gray-950">
        <div className="overflow-x-auto">
          <pre className="table w-full table-fixed text-sm leading-relaxed">
            <code className={`${className || ""} whitespace-pre font-mono`}>
              {children}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeRenderer;
