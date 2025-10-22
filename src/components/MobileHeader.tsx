import { PlusCircleIcon } from "@heroicons/react/24/outline";

interface MobileHeaderProps {
  onCreateChat: (e: React.FormEvent<HTMLFormElement>) => void;
  isDisabled: boolean;
}

const MobileHeader = ({ onCreateChat, isDisabled }: MobileHeaderProps) => (
  <div className="sticky top-0 w-full border-b border-[#2C2D36] bg-[#343541] shadow-sm md:hidden">
    <div className="relative flex h-14 items-center space-x-5 text-gray-300">
      <div className="inset-y-0 m-auto flex">
        <h2 className="text-base">Let&apos;s go!</h2>

        <form onSubmit={onCreateChat} className="absolute right-5">
          <button
            type="submit"
            disabled={isDisabled}
            className="transition-opacity duration-200 hover:opacity-75 disabled:opacity-50"
            aria-label="Create new chat"
          >
            <PlusCircleIcon className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  </div>
);

export default MobileHeader;
