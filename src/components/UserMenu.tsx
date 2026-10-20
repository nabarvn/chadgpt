import { Session } from "next-auth";
import { memo, useMemo } from "react";
import { validateAndTransformSession } from "@/lib/utils";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { HistoryControl, ThemeSwitcher, UserAvatar } from "@/components";

const UserMenu = memo(
  ({
    session,
    onLogout,
    onMenuAction,
    isLoggingOut = false,
  }: {
    session: Session | null;
    onLogout: () => void;
    onMenuAction?: () => void;
    isLoggingOut?: boolean;
  }) => {
    const { userImage, userName } = useMemo(
      () => validateAndTransformSession(session),
      [session],
    );

    return (
      <>
        <div className="flex flex-col space-y-2">
          <HistoryControl />

          <div onClick={onMenuAction}>
            <ThemeSwitcher />
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="adminRow w-full !justify-between disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
          aria-label="Log out"
        >
          <div className="flex items-center justify-center space-x-2">
            <ArrowRightOnRectangleIcon
              className="h-4 w-4 text-gray-500"
              aria-hidden="true"
            />

            <p className="text-gray-300">Log out</p>
          </div>

          <UserAvatar userImage={userImage} userName={userName} />
        </button>
      </>
    );
  },
);

export default UserMenu;
