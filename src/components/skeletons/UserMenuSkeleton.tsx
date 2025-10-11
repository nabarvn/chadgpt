import React from "react";

const UserMenuSkeleton = () => {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-11 w-full rounded-lg bg-gray-700" />
      <div className="h-11 w-full rounded-lg bg-gray-700" />

      <div className="flex items-center justify-between rounded-lg bg-gray-700 px-3 py-3">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-gray-600" />
          <div className="h-4 w-20 rounded-lg bg-gray-600" />
        </div>

        <div className="h-5 w-5 rounded-full bg-gray-600" />
      </div>
    </div>
  );
};

export default UserMenuSkeleton;
