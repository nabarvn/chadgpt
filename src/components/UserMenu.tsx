import { Session } from "next-auth";
import { memo, useCallback, useMemo } from "react";
import { validateAndTransformSession } from "@/lib/utils";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { HistoryControl, ThemeSwitcher, UserAvatar } from "@/components";

const UserMenu = memo(
  ({
    session,
    onLogout,
    onMenuAction,
  }: {
    session: Session | null;
    onLogout: () => void;
    onMenuAction?: () => void;
  }) => {
    const { userImage, userName } = useMemo(
      () => validateAndTransformSession(session),
      [session],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onLogout();
        }
      },
      [onLogout],
    );

    return (
      <>
        <div className="flex flex-col space-y-2">
          <HistoryControl />

          <div onClick={onMenuAction}>
            <ThemeSwitcher />
          </div>
        </div>

        <div
          onClick={onLogout}
          onKeyDown={handleKeyDown}
          className="adminRow cursor-pointer !justify-between"
          role="button"
          tabIndex={0}
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
        </div>
      </>
    );
  },
);

export default UserMenu;
