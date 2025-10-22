import Link from "next/link";
import { memo } from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const ExternalLink = memo(() => (
  <Link
    target="_blank"
    title="Lumen"
    rel="noopener noreferrer"
    href="https://lumen.nabarun.app"
    className="flex w-full items-center gap-2 rounded-lg bg-[#434654] px-3 py-3 text-sm text-gray-300 transition-all duration-200 hover:ring-1 hover:ring-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
    aria-label="Open Lumen - Beyond traditional web search (opens in new tab)"
  >
    <ArrowTopRightOnSquareIcon
      className="h-4 w-4 self-center text-gray-300"
      aria-hidden="true"
    />
    Beyond traditional web search
  </Link>
));

export default ExternalLink;
