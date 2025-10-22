import { Message } from "@/typings";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

interface ChatHeaderProps {
  displayMessages: Message[];
  isInitialized: boolean;
  isCreating: boolean;
  isPending: boolean;
  onCreateChat: () => Promise<void>;
}

const ChatHeader = ({
  displayMessages,
  isInitialized,
  isCreating,
  isPending,
  onCreateChat,
}: ChatHeaderProps) => (
  <div className="sticky top-0 h-14 w-full border-b border-[#2C2D36] bg-[#343541] shadow-sm md:hidden">
    <div className="relative flex h-full items-center text-gray-300">
      <div className="inset-y-0 m-auto w-[16.50rem] pl-2">
        <p className="relative truncate text-center text-base">
          {isInitialized &&
            (displayMessages[displayMessages.length - 1]?.text || "New Chat")}

          <span className="absolute inset-y-0 right-0 z-10 h-7 w-9 bg-gradient-to-l from-[#343541] opacity-90" />
        </p>
      </div>

      <button
        onClick={onCreateChat}
        className="absolute right-5 transition-opacity duration-200 hover:opacity-75 disabled:opacity-50"
        disabled={isCreating || isPending}
        aria-label="Create new chat"
      >
        <PlusCircleIcon className="h-6 w-6" />
      </button>
    </div>
  </div>
);

export default ChatHeader;
