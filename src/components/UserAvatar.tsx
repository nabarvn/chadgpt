import Image from "next/image";
import { memo, useCallback } from "react";

const CONSTANTS = {
  DEFAULT_AVATAR: "/default-avatar.png",
};

const UserAvatar = memo(
  ({ userImage, userName }: { userImage?: string; userName?: string }) => {
    const handleImageError = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.src = CONSTANTS.DEFAULT_AVATAR;
      },
      [],
    );

    return (
      <Image
        priority
        unoptimized
        src={userImage || CONSTANTS.DEFAULT_AVATAR}
        referrerPolicy="no-referrer"
        height={20}
        width={20}
        className="h-5 w-5 rounded-full"
        alt={
          userName ? `${userName}'s profile picture` : "User profile picture"
        }
        onError={handleImageError}
      />
    );
  },
);

export default UserAvatar;
