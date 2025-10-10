import Link from "next/link";
import { ReactNode } from "react";

interface LinkRendererProps {
  children: ReactNode;
  href?: string;
}

const LinkRenderer = ({ children, href }: LinkRendererProps) => {
  if (!href) {
    return <>{children}</>;
  }

  const isExternal = href.startsWith("http") || href.startsWith("https");

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="break-words text-blue-500 underline underline-offset-2 transition-colors duration-200 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="break-words text-blue-500 underline underline-offset-2 transition-colors duration-200 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {children}
    </Link>
  );
};

export default LinkRenderer;
